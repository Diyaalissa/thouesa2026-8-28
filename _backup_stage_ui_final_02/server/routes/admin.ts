import { Request, Response, Router } from 'express';
import { db } from '../store';
import { Dispute, DisputeStatus } from '../../src/types';

export const adminRouter = Router();

// Master Admin Analytics Overview
adminRouter.get('/stats', (req: Request, res: Response) => {
  const shipments = Array.from(db.shipments.values());
  const trips = Array.from(db.trips.values());
  const users = Array.from(db.users.values());
  const transactions = Array.from(db.transactions.values());

  const totalVolume = shipments.length;
  const activeShipments = shipments.filter(
    (s) => s.currentStatus !== 'DELIVERED' && s.currentStatus !== 'CANCELLED'
  ).length;

  const deliveredShipments = shipments.filter((s) => s.currentStatus === 'DELIVERED').length;

  const totalEscrowLocked = Array.from(db.wallets.values()).reduce(
    (sum, w) => sum + (w.lockedEscrowDeposit || 0),
    0
  );

  const grossRevenue = transactions
    .filter((t) => t.type === 'SHIPPING_PAYMENT' && t.status === 'COMMITTED')
    .reduce((sum, t) => sum + t.amount, 0);

  const verifiedTravelersCount = users.filter(
    (u) => u.role === 'TRAVELER' && u.kycStatus === 'VERIFIED'
  ).length;

  const openDisputesCount = Array.from(db.disputes.values()).filter(
    (d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW'
  ).length;

  res.json({
    success: true,
    stats: {
      totalVolume,
      activeShipments,
      deliveredShipments,
      totalEscrowLocked: Number(totalEscrowLocked.toFixed(2)),
      grossRevenue: Number(grossRevenue.toFixed(2)),
      verifiedTravelersCount,
      openDisputesCount,
      activeTripsCount: trips.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length,
    },
  });
});

// Audit Logs Explorer
adminRouter.get('/audit-logs', (req: Request, res: Response) => {
  const { domain, limit } = req.query;
  let logs = [...db.auditLogs];

  if (domain) {
    logs = logs.filter((l) => l.domain === domain);
  }

  const max = limit ? parseInt(limit as string, 10) : 50;
  res.json({ success: true, auditLogs: logs.slice(0, max) });
});

// Disputes: List all
adminRouter.get('/disputes', (req: Request, res: Response) => {
  const disputes = Array.from(db.disputes.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ success: true, disputes });
});

// Disputes: Create new dispute claim with dual-hub investigator assignment
adminRouter.post('/disputes', (req: Request, res: Response) => {
  const {
    shipmentId,
    claimantId,
    claimantName,
    claimantRole,
    reason,
    description,
    claimAmount,
    evidencePhotos,
    priority,
    originEmployeeId,
    destinationEmployeeId,
  } = req.body;

  const shipment = db.shipments.get(shipmentId);
  if (!shipment) {
    return res.status(404).json({ success: false, error: 'Shipment not found' });
  }

  // 1. Resolve Origin Hub and Investigator
  const originHub = db.hubs.get(shipment.originHubId);
  const originHubName = originHub ? originHub.nameAr : shipment.originHubId;
  let originEmp = originEmployeeId ? db.employees.get(originEmployeeId) : null;
  if (!originEmp) {
    // Find default active employee in origin hub
    originEmp = Array.from(db.employees.values()).find(
      (e) => e.assignedHubId === shipment.originHubId && e.isActive
    ) || null;
  }

  // 2. Resolve Destination Hub and Investigator
  const destHub = db.hubs.get(shipment.destinationHubId);
  const destHubName = destHub ? destHub.nameAr : shipment.destinationHubId;
  let destEmp = destinationEmployeeId ? db.employees.get(destinationEmployeeId) : null;
  if (!destEmp) {
    // Find default active employee in destination hub
    destEmp = Array.from(db.employees.values()).find(
      (e) => e.assignedHubId === shipment.destinationHubId && e.isActive
    ) || null;
  }

  const newDispute: Dispute = {
    id: `disp-${Date.now()}`,
    shipmentId,
    trackingNumber: shipment.trackingNumber,
    claimantId,
    claimantName,
    claimantRole: claimantRole || 'SENDER',
    priority: priority || 'HIGH',
    reason,
    description,
    evidencePhotos: evidencePhotos || [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&auto=format&fit=crop&q=80',
    ],
    claimAmount: Number(claimAmount) || shipment.declaredValue,
    currency: 'USD',
    status: 'UNDER_REVIEW',
    originHubId: shipment.originHubId,
    originHubName,
    originReview: originEmp
      ? {
          employeeId: originEmp.id,
          employeeName: originEmp.fullName,
          employeeStaffCode: originEmp.staffCode,
          hubId: shipment.originHubId,
          hubName: originHubName,
          hubCountryCode: originHub?.countryCode || 'JOR',
          hubRole: 'ORIGIN',
          decision: 'PENDING',
          notes: '',
        }
      : undefined,
    destinationHubId: shipment.destinationHubId,
    destinationHubName: destHubName,
    destinationReview: destEmp
      ? {
          employeeId: destEmp.id,
          employeeName: destEmp.fullName,
          employeeStaffCode: destEmp.staffCode,
          hubId: shipment.destinationHubId,
          hubName: destHubName,
          hubCountryCode: destHub?.countryCode || 'DZA',
          hubRole: 'DESTINATION',
          decision: 'PENDING',
          notes: '',
        }
      : undefined,
    assignedEmployeeId: originEmp?.id || destEmp?.id,
    assignedEmployeeName: originEmp?.fullName || destEmp?.fullName,
    createdAt: new Date().toISOString(),
  };

  db.disputes.set(newDispute.id, newDispute);
  shipment.currentStatus = 'DISPUTED';
  db.shipments.set(shipment.id, shipment);

  // 3. Dispatch Notification to Origin Hub Investigator (e.g. Jordan)
  if (originEmp) {
    db.pushNotification({
      type: 'DISPUTE_RAISED',
      titleAr: `تكليف بتحكيم نزاع: شحنة ${shipment.trackingNumber} (فرع الإرسال)`,
      titleEn: `Dispute Assignment: ${shipment.trackingNumber} (Origin Hub)`,
      messageAr: `تم تكليفك بالتحقيق في نزاع الشحنة ${shipment.trackingNumber} ممثلاً لفرع الإرسال (${originHubName}). يرجى مراجعة الأدلة وتقديم قرارك.`,
      messageEn: `Assigned as origin investigator for ${shipment.trackingNumber} (${originHubName}). Please inspect evidence and submit decision.`,
      targetRole: originEmp.role,
      targetUserId: originEmp.id,
      referenceId: newDispute.id,
      priority: 'HIGH',
    });
  }

  // 4. Dispatch Notification to Destination Hub Investigator (e.g. Algeria)
  if (destEmp) {
    db.pushNotification({
      type: 'DISPUTE_RAISED',
      titleAr: `تكليف بتحكيم نزاع: شحنة ${shipment.trackingNumber} (فرع الاستلام)`,
      titleEn: `Dispute Assignment: ${shipment.trackingNumber} (Destination Hub)`,
      messageAr: `تم تكليفك بالتحقيق في نزاع الشحنة ${shipment.trackingNumber} ممثلاً لفرع الاستلام (${destHubName}). يرجى مراجعة الأدلة وتقديم قرارك.`,
      messageEn: `Assigned as destination investigator for ${shipment.trackingNumber} (${destHubName}). Please inspect evidence and submit decision.`,
      targetRole: destEmp.role,
      targetUserId: destEmp.id,
      referenceId: newDispute.id,
      priority: 'HIGH',
    });
  }

  // 5. Admin Notification
  db.pushNotification({
    type: 'DISPUTE_RAISED',
    titleAr: 'تم فتح نزاع وتكليف فرعي الإرسال والاستلام بالتحكيم الثنائي',
    titleEn: 'Dual-Hub Dispute Arbitration Initialized',
    messageAr: `قام ${claimantName} بفتح نزاع على الشحنة ${shipment.trackingNumber} بمبلغ $${newDispute.claimAmount}. تم تكليف محقق فرع ${originHubName} ومحقق فرع ${destHubName}. تم تجميد الضمان المالي.`,
    messageEn: `${claimantName} filed a dispute on ${shipment.trackingNumber} for $${newDispute.claimAmount}. Assigned ${originHubName} and ${destHubName} officers. Escrow frozen.`,
    targetRole: 'MASTER_ADMIN',
    referenceId: newDispute.id,
    priority: 'HIGH',
  });

  db.logAudit({
    actorId: claimantId,
    actorName: claimantName,
    actorRole: claimantRole || 'SENDER',
    domain: 'Governance',
    action: 'CREATE_DUAL_HUB_DISPUTE',
    resourceType: 'Dispute',
    resourceId: newDispute.id,
    details: {
      reason,
      claimAmount: newDispute.claimAmount,
      trackingNumber: shipment.trackingNumber,
      originInvestigator: originEmp?.fullName,
      destinationInvestigator: destEmp?.fullName,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Dual-Hub dispute claim filed and officers notified successfully.',
    dispute: newDispute,
  });
});

// Disputes: Assign / Reassign Dual Hub Investigators
adminRouter.put('/disputes/:id/assign', (req: Request, res: Response) => {
  const { id } = req.params;
  const { originEmployeeId, destinationEmployeeId, priority, adminId } = req.body;

  const dispute = db.disputes.get(id);
  if (!dispute) {
    return res.status(404).json({ success: false, error: 'Dispute not found' });
  }

  const shipment = db.shipments.get(dispute.shipmentId);

  // Update Origin Investigator
  if (originEmployeeId) {
    const originEmp = db.employees.get(originEmployeeId);
    if (originEmp) {
      dispute.originReview = {
        employeeId: originEmp.id,
        employeeName: originEmp.fullName,
        employeeStaffCode: originEmp.staffCode,
        hubId: originEmp.assignedHubId,
        hubName: originEmp.assignedHubName,
        hubRole: 'ORIGIN',
        decision: dispute.originReview?.decision || 'PENDING',
        notes: dispute.originReview?.notes || '',
        decidedAt: dispute.originReview?.decidedAt,
        digitalSignature: dispute.originReview?.digitalSignature,
      };

      db.pushNotification({
        type: 'DISPUTE_RAISED',
        titleAr: `تكليف بتحكيم نزاع: شحنة ${dispute.trackingNumber} (فرع الإرسال)`,
        titleEn: `Dispute Assignment: ${dispute.trackingNumber} (Origin)`,
        messageAr: `تم تكليفك بالتحقيق في نزاع الشحنة ${dispute.trackingNumber} ممثلاً لفرع الإرسال (${originEmp.assignedHubName}). يرجى مراجعة وتأكيد القرار.`,
        messageEn: `Assigned as origin investigator for ${dispute.trackingNumber}. Please review and approve.`,
        targetRole: originEmp.role,
        targetUserId: originEmp.id,
        referenceId: dispute.id,
        priority: 'HIGH',
      });
    }
  }

  // Update Destination Investigator
  if (destinationEmployeeId) {
    const destEmp = db.employees.get(destinationEmployeeId);
    if (destEmp) {
      dispute.destinationReview = {
        employeeId: destEmp.id,
        employeeName: destEmp.fullName,
        employeeStaffCode: destEmp.staffCode,
        hubId: destEmp.assignedHubId,
        hubName: destEmp.assignedHubName,
        hubRole: 'DESTINATION',
        decision: dispute.destinationReview?.decision || 'PENDING',
        notes: dispute.destinationReview?.notes || '',
        decidedAt: dispute.destinationReview?.decidedAt,
        digitalSignature: dispute.destinationReview?.digitalSignature,
      };

      db.pushNotification({
        type: 'DISPUTE_RAISED',
        titleAr: `تكليف بتحكيم نزاع: شحنة ${dispute.trackingNumber} (فرع الاستلام)`,
        titleEn: `Dispute Assignment: ${dispute.trackingNumber} (Destination)`,
        messageAr: `تم تكليفك بالتحقيق في نزاع الشحنة ${dispute.trackingNumber} ممثلاً لفرع الاستلام (${destEmp.assignedHubName}). يرجى مراجعة وتأكيد القرار.`,
        messageEn: `Assigned as destination investigator for ${dispute.trackingNumber}. Please review and approve.`,
        targetRole: destEmp.role,
        targetUserId: destEmp.id,
        referenceId: dispute.id,
        priority: 'HIGH',
      });
    }
  }

  if (priority) dispute.priority = priority;
  if (dispute.status === 'OPEN') {
    dispute.status = 'UNDER_REVIEW';
  }

  db.disputes.set(dispute.id, dispute);

  db.logAudit({
    actorId: adminId || 'usr-admin-001',
    actorName: 'Master Admin',
    actorRole: 'MASTER_ADMIN',
    domain: 'Governance',
    action: 'ASSIGN_DUAL_DISPUTE_INVESTIGATORS',
    resourceType: 'Dispute',
    resourceId: dispute.id,
    details: {
      originEmployeeId,
      destinationEmployeeId,
      priority,
      trackingNumber: dispute.trackingNumber,
    },
  });

  res.json({
    success: true,
    message: 'Dual-hub investigators assigned and notified successfully.',
    dispute,
  });
});

// Disputes: Submit Employee Vote / Sign-off Decision (Dual Approval Consensus)
adminRouter.post('/disputes/:id/vote', (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    employeeId,
    employeeName,
    hubId,
    decision, // 'APPROVED_REFUND' | 'APPROVED_ESCROW_RELEASE' | 'REJECTED'
    notes,
    digitalSignature,
  } = req.body;

  const dispute = db.disputes.get(id);
  if (!dispute) {
    return res.status(404).json({ success: false, error: 'Dispute not found' });
  }

  const shipment = db.shipments.get(dispute.shipmentId);
  const now = new Date().toISOString();
  let roleUpdated: 'ORIGIN' | 'DESTINATION' | 'GENERIC' = 'GENERIC';

  // Check if employee matches Origin Review
  if (
    dispute.originReview &&
    (dispute.originReview.employeeId === employeeId || dispute.originReview.hubId === hubId)
  ) {
    dispute.originReview.decision = decision;
    dispute.originReview.notes = notes || dispute.originReview.notes;
    dispute.originReview.decidedAt = now;
    dispute.originReview.digitalSignature =
      digitalSignature || `HMAC_SIG_${dispute.originReview.hubCountryCode || 'ORIG'}_${employeeId.slice(-4)}_${Date.now().toString().slice(-4)}`;
    if (employeeName) dispute.originReview.employeeName = employeeName;
    roleUpdated = 'ORIGIN';
  }
  // Check if employee matches Destination Review
  else if (
    dispute.destinationReview &&
    (dispute.destinationReview.employeeId === employeeId || dispute.destinationReview.hubId === hubId)
  ) {
    dispute.destinationReview.decision = decision;
    dispute.destinationReview.notes = notes || dispute.destinationReview.notes;
    dispute.destinationReview.decidedAt = now;
    dispute.destinationReview.digitalSignature =
      digitalSignature || `HMAC_SIG_${dispute.destinationReview.hubCountryCode || 'DEST'}_${employeeId.slice(-4)}_${Date.now().toString().slice(-4)}`;
    if (employeeName) dispute.destinationReview.employeeName = employeeName;
    roleUpdated = 'DESTINATION';
  }
  // If no previous object existed, create / attach appropriately
  else if (dispute.originHubId === hubId || (!dispute.originReview && roleUpdated === 'GENERIC')) {
    dispute.originReview = {
      employeeId,
      employeeName: employeeName || 'Origin Staff',
      hubId: hubId || dispute.originHubId || 'hub-amm',
      hubName: dispute.originHubName || 'فرع الإرسال',
      hubRole: 'ORIGIN',
      decision,
      notes,
      decidedAt: now,
      digitalSignature: digitalSignature || `HMAC_SIG_ORIG_${Date.now().toString().slice(-4)}`,
    };
    roleUpdated = 'ORIGIN';
  } else {
    dispute.destinationReview = {
      employeeId,
      employeeName: employeeName || 'Destination Staff',
      hubId: hubId || dispute.destinationHubId || 'hub-alg',
      hubName: dispute.destinationHubName || 'فرع الوصول',
      hubRole: 'DESTINATION',
      decision,
      notes,
      decidedAt: now,
      digitalSignature: digitalSignature || `HMAC_SIG_DEST_${Date.now().toString().slice(-4)}`,
    };
    roleUpdated = 'DESTINATION';
  }

  // Evaluate Dual-Approval Consensus
  const originDec = dispute.originReview?.decision;
  const destDec = dispute.destinationReview?.decision;

  let consensusMsg = '';

  if (originDec && destDec && originDec !== 'PENDING' && destDec !== 'PENDING') {
    if (originDec === destDec) {
      // Both Approved the Same Resolution!
      dispute.consensusReached = true;
      if (originDec === 'APPROVED_REFUND') {
        dispute.status = 'RESOLVED_REFUND';
        consensusMsg = 'تم إجماع الفرعين (الأردن والجزائر) على تعويض المرسل واسترداد المبلغ.';
      } else if (originDec === 'APPROVED_ESCROW_RELEASE') {
        dispute.status = 'RESOLVED_ESCROW_RELEASE';
        consensusMsg = 'تم إجماع الفرعين على سلامة الشحنة والإفراج عن الضمان المالي للمسافر.';
      } else {
        dispute.status = 'REJECTED';
        consensusMsg = 'تم إجماع الفرعين على رفض الشكوى.';
      }
      dispute.resolvedAt = now;
      dispute.resolutionNotes = `Dual Consensus Achieved: Both Origin (${dispute.originReview?.employeeName}) and Destination (${dispute.destinationReview?.employeeName}) agreed on ${originDec}.`;

      // Execute financial resolution if agreed on refund
      if (shipment && originDec === 'APPROVED_REFUND') {
        shipment.currentStatus = 'CANCELLED';
        const senderWallet = db.wallets.get(shipment.senderId);
        if (senderWallet) {
          senderWallet.balance = Number((senderWallet.balance + dispute.claimAmount).toFixed(2));
          db.wallets.set(senderWallet.userId, senderWallet);
        }
        db.recordTransaction({
          transactionCode: `TXN-REF-${Date.now().toString().slice(-6)}`,
          walletId: `wlt-${shipment.senderId}`,
          userId: shipment.senderId,
          userName: shipment.senderName,
          shipmentId: shipment.id,
          type: 'REFUND',
          amount: dispute.claimAmount,
          currency: 'USD',
          exchangeRateToUsd: 1.0,
          idempotencyKey: `idemp-disp-consensus-${dispute.id}`,
          status: 'COMMITTED',
          referenceNote: `Consensus refund approved by both Origin & Destination Hubs for ${dispute.trackingNumber}`,
        });
        db.shipments.set(shipment.id, shipment);
      } else if (shipment && originDec === 'APPROVED_ESCROW_RELEASE') {
        shipment.currentStatus = 'READY_FOR_PICKUP';
        db.shipments.set(shipment.id, shipment);
      }

      // Notify Master Admin & Both Hubs of Consensus
      db.pushNotification({
        type: 'DISPUTE_RAISED',
        titleAr: `إجماع تحكيمي كامل (2/2): نزاع الشحنة ${dispute.trackingNumber}`,
        titleEn: `Dual-Consensus Reached for ${dispute.trackingNumber}`,
        messageAr: `تمت موافقة فرع الإرسال (${dispute.originReview?.employeeName}) وفرع الوصول (${dispute.destinationReview?.employeeName}) بالإجماع على القرار: ${consensusMsg}`,
        messageEn: `Both origin and destination investigators agreed on resolution: ${originDec}.`,
        targetRole: 'MASTER_ADMIN',
        referenceId: dispute.id,
        priority: 'HIGH',
      });
    } else {
      // Split vote / Disagreement -> Requires Master Admin Intervention
      dispute.consensusReached = false;
      dispute.status = 'UNDER_REVIEW';
      dispute.resolutionNotes = `Disagreement between hubs: Origin voted ${originDec} while Destination voted ${destDec}. Escalated to Master Admin.`;

      db.pushNotification({
        type: 'DISPUTE_RAISED',
        titleAr: `تضارب في قرارات الفرعين بخصوص نزاع ${dispute.trackingNumber}`,
        titleEn: `Dispute Disagreement Escalation (${dispute.trackingNumber})`,
        messageAr: `صوّت فرع الإرسال بـ (${originDec}) وفرع الوصول بـ (${destDec}). يتطلب النزاع التدخل المباشر للبت من قبل الإدارة المركزية.`,
        messageEn: `Hubs voted differently (${originDec} vs ${destDec}). Master Admin resolution required.`,
        targetRole: 'MASTER_ADMIN',
        referenceId: dispute.id,
        priority: 'HIGH',
      });
    }
  } else {
    // Only 1 of 2 has decided so far
    dispute.consensusReached = false;
    dispute.status = 'UNDER_REVIEW';

    // Notify the other investigator
    const targetUserId =
      roleUpdated === 'ORIGIN'
        ? dispute.destinationReview?.employeeId
        : dispute.originReview?.employeeId;

    if (targetUserId) {
      db.pushNotification({
        type: 'DISPUTE_RAISED',
        titleAr: `تم تسجيل قرار الفرع المقابل في نزاع ${dispute.trackingNumber}`,
        titleEn: `Partner Hub Voted on Dispute (${dispute.trackingNumber})`,
        messageAr: `قام محقق الفرع المقابل (${employeeName || 'زميلك'}) بتقديم قراره (${decision}). بانتظار قرارك لاستكمال التحكيم المشترك (1/2).`,
        messageEn: `Partner investigator submitted decision (${decision}). Awaiting your vote to complete consensus.`,
        targetRole: 'ALL',
        targetUserId,
        referenceId: dispute.id,
        priority: 'HIGH',
      });
    }
  }

  db.disputes.set(dispute.id, dispute);

  db.logAudit({
    actorId: employeeId,
    actorName: employeeName || 'Hub Investigator',
    actorRole: 'HUB_AGENT',
    domain: 'Governance',
    action: `SUBMIT_DISPUTE_VOTE_${decision}`,
    resourceType: 'Dispute',
    resourceId: dispute.id,
    details: {
      roleUpdated,
      decision,
      notes,
      consensusReached: dispute.consensusReached,
      status: dispute.status,
    },
  });

  res.json({
    success: true,
    message: dispute.consensusReached
      ? `Consensus achieved: ${consensusMsg}`
      : 'Decision recorded successfully. Awaiting partner branch review.',
    dispute,
  });
});

// Disputes: Resolve claim (Refund or Escrow Forfeit)
adminRouter.post('/disputes/:id/resolve', (req: Request, res: Response) => {
  const { id } = req.params;
  const { resolutionStatus, resolutionNotes, adminId } = req.body; // 'RESOLVED_REFUND' | 'RESOLVED_ESCROW_RELEASE' | 'REJECTED'

  const dispute = db.disputes.get(id);
  if (!dispute) {
    return res.status(404).json({ success: false, error: 'Dispute not found' });
  }

  dispute.status = resolutionStatus as DisputeStatus;
  dispute.resolutionNotes = resolutionNotes;
  dispute.resolvedByAdminId = adminId || 'usr-admin-001';
  dispute.resolvedAt = new Date().toISOString();
  db.disputes.set(dispute.id, dispute);

  const shipment = db.shipments.get(dispute.shipmentId);
  if (shipment) {
    if (resolutionStatus === 'RESOLVED_REFUND') {
      shipment.currentStatus = 'CANCELLED';
      // Credit sender refund from forfeited escrow
      const senderWallet = db.wallets.get(shipment.senderId);
      if (senderWallet) {
        senderWallet.balance = Number((senderWallet.balance + dispute.claimAmount).toFixed(2));
        db.wallets.set(senderWallet.userId, senderWallet);
      }

      db.recordTransaction({
        transactionCode: `TXN-REF-${Date.now().toString().slice(-6)}`,
        walletId: `wlt-${shipment.senderId}`,
        userId: shipment.senderId,
        userName: shipment.senderName,
        shipmentId: shipment.id,
        type: 'REFUND',
        amount: dispute.claimAmount,
        currency: 'USD',
        exchangeRateToUsd: 1.0,
        idempotencyKey: `idemp-disp-ref-${dispute.id}`,
        status: 'COMMITTED',
        referenceNote: `Dispute claim refund approved by Master Admin (${dispute.reason})`,
      });
    } else {
      shipment.currentStatus = 'READY_FOR_PICKUP';
    }
    db.shipments.set(shipment.id, shipment);
  }

  db.logAudit({
    actorId: adminId || 'usr-admin-001',
    actorName: 'Master Admin',
    actorRole: 'MASTER_ADMIN',
    domain: 'Governance',
    action: `RESOLVE_DISPUTE_${resolutionStatus}`,
    resourceType: 'Dispute',
    resourceId: dispute.id,
    details: { notes: resolutionNotes },
  });

  res.json({
    success: true,
    message: `Dispute resolved with status: ${resolutionStatus}`,
    dispute,
  });
});

// Employee Management: List all employees
adminRouter.get('/employees', (req: Request, res: Response) => {
  const employees = Array.from(db.employees.values());
  res.json({ success: true, employees });
});

// Employee Management: Create new employee account
adminRouter.post('/employees', (req: Request, res: Response) => {
  const {
    fullName,
    email,
    phone,
    assignedHubId,
    role,
    passwordPin,
    permissions,
    adminId,
  } = req.body;

  if (!fullName || !email || !assignedHubId || !passwordPin) {
    return res.status(400).json({
      success: false,
      error: 'الاسم، البريد الإلكتروني، الفرع المعين، ورمز PIN هي حقول إجبارية.',
    });
  }

  const hub = db.hubs.get(assignedHubId);
  const hubCode = hub ? hub.code.split('-')[0] : 'HUB';
  const staffCode = `EMP-${hubCode}-${Math.floor(100 + Math.random() * 900)}`;
  const employeeId = `emp-${Date.now()}`;

  const newEmployee = {
    id: employeeId,
    staffCode,
    fullName,
    email,
    phone: phone || '+962 70 000 0000',
    assignedHubId,
    assignedHubName: hub ? `${hub.nameAr} (${hub.code})` : 'الفرع الميداني',
    role: role || 'HUB_AGENT',
    passwordPin,
    isActive: true,
    permissions: permissions || ['INTAKE_INSPECT', 'MANIFEST_BUILD', 'RECIPIENT_DELIVERY'],
    createdAt: new Date().toISOString(),
  };

  db.employees.set(newEmployee.id, newEmployee);

  // Register in user store as well
  db.users.set(newEmployee.id, {
    id: newEmployee.id,
    fullName: newEmployee.fullName,
    email: newEmployee.email,
    phone: newEmployee.phone,
    role: newEmployee.role,
    kycStatus: 'VERIFIED',
    isActive: true,
    preferredLocale: 'ar',
    assignedHubId: newEmployee.assignedHubId,
    staffCode: newEmployee.staffCode,
    createdAt: newEmployee.createdAt,
  });

  db.logAudit({
    actorId: adminId || 'usr-admin-001',
    actorName: 'Master Admin',
    actorRole: 'MASTER_ADMIN',
    domain: 'HubOperations',
    action: 'CREATE_EMPLOYEE_ACCOUNT',
    resourceType: 'Employee',
    resourceId: newEmployee.id,
    details: { staffCode: newEmployee.staffCode, hubId: assignedHubId, role: newEmployee.role },
  });

  res.json({
    success: true,
    message: `تم إنشاء حساب الموظف ${newEmployee.fullName} برقم وظيفي (${newEmployee.staffCode}) بنجاح.`,
    employee: newEmployee,
  });
});

// Employee Management: Toggle Active status
adminRouter.post('/employees/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;
  const { adminId } = req.body;
  const employee = db.employees.get(id);

  if (!employee) {
    return res.status(404).json({ success: false, error: 'الموظف غير موجود' });
  }

  employee.isActive = !employee.isActive;
  db.employees.set(employee.id, employee);

  const user = db.users.get(employee.id);
  if (user) {
    user.isActive = employee.isActive;
    db.users.set(user.id, user);
  }

  db.logAudit({
    actorId: adminId || 'usr-admin-001',
    actorName: 'Master Admin',
    actorRole: 'MASTER_ADMIN',
    domain: 'HubOperations',
    action: employee.isActive ? 'ACTIVATE_EMPLOYEE' : 'DEACTIVATE_EMPLOYEE',
    resourceType: 'Employee',
    resourceId: employee.id,
    details: { staffCode: employee.staffCode, isActive: employee.isActive },
  });

  res.json({
    success: true,
    message: `تم ${employee.isActive ? 'تفعيل' : 'تعطيل'} حساب الموظف ${employee.fullName} بنجاح.`,
    employee,
  });
});

// Admin KYC Decision (Approve / Reject traveler or sender verification)
adminRouter.post('/kyc-decision', (req: Request, res: Response) => {
  const { userId, status, adminId } = req.body;
  const user = db.users.get(userId);

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  user.kycStatus = status === 'APPROVED' ? 'VERIFIED' : 'REJECTED';
  db.users.set(user.id, user);

  db.logAudit({
    actorId: adminId || 'usr-admin-001',
    actorName: 'Master Admin',
    actorRole: 'MASTER_ADMIN',
    domain: 'Governance',
    action: `KYC_DECISION_${status}`,
    resourceType: 'User',
    resourceId: user.id,
    details: { targetUser: user.fullName, newKycStatus: user.kycStatus },
  });

  return res.json({
    success: true,
    message: `KYC status for ${user.fullName} updated to ${user.kycStatus}.`,
    user,
  });
});

