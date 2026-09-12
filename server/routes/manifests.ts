import { Request, Response, Router } from 'express';
import { db } from '../store';
import { Manifest } from '../../src/types';
import { generateCryptographicHandoverToken, verifyCryptographicHandoverToken } from '../../src/lib/crypto';
import { broadcastNotification } from './notifications';

export const manifestsRouter = Router();

// GET all manifests
manifestsRouter.get('/', (req: Request, res: Response) => {
  const manifests = Array.from(db.manifests.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ success: true, manifests });
});

// GET single manifest
manifestsRouter.get('/:id', (req: Request, res: Response) => {
  const manifest = db.manifests.get(req.params.id);
  if (!manifest) {
    return res.status(404).json({ success: false, error: 'Manifest not found' });
  }
  res.json({ success: true, manifest });
});

// POST create manifest (Stage 02 — Manifest Lifecycle: creates DRAFT by default)
manifestsRouter.post('/', (req: Request, res: Response) => {
  const {
    id,
    manifestNumber,
    manifestCode: customCode,
    tripId,
    agentId,
    shipmentIds: rawShipmentIds,
    status: requestedStatus,
    totalWeightKg: customWeight,
  } = req.body;

  const resolvedTripId = tripId || req.body.manifest?.tripId;
  const trip = resolvedTripId ? db.trips.get(resolvedTripId) : undefined;
  if (!trip) {
    return res.status(404).json({ success: false, error: 'Trip not found' });
  }

  const shipmentIds: string[] = rawShipmentIds || req.body.manifest?.shipmentIds || [];
  const packages = Array.from(db.shipments.values()).filter((s) => shipmentIds.includes(s.id));

  const totalWeight = customWeight !== undefined
    ? Number(customWeight)
    : Number(packages.reduce((sum, p) => sum + (p.actualWeightKg || p.estimatedWeightKg || 0), 0).toFixed(2));

  const totalValue = Number(packages.reduce((sum, p) => sum + (p.declaredValue || 0), 0).toFixed(2));
  const sealIds = packages.map((p) => p.securitySealId).filter(Boolean) as string[];

  const manifestId = id || `MF-${trip.originHubId.replace('hub-', '').toUpperCase()}-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Date.now().toString().slice(-3)}`;
  const manifestCode = customCode || `MF-${trip.originHubId.replace('hub-', '').toUpperCase()}-${trip.flightNumber}`;

  // Stage 02 Constraint: Status is DRAFT unless specified otherwise
  const canonicalStatus = requestedStatus || 'DRAFT';

  const manifest: Manifest = {
    id: manifestId,
    manifestCode,
    manifestNumber: manifestNumber || manifestId,
    tripId: trip.id,
    travelerId: trip.travelerId,
    travelerName: trip.travelerName,
    airline: trip.airline,
    flightNumber: trip.flightNumber,
    originHubId: trip.originHubId,
    destinationHubId: trip.destinationHubId,
    dispatchedByAgentId: agentId || 'usr-agent-303',
    shipmentIds,
    totalPackages: packages.length,
    totalShipmentsCount: packages.length,
    totalWeightKg: totalWeight,
    totalDeclaredValue: totalValue,
    handoverQrSecret: `HMAC_TK_${manifestId}_${Date.now()}`,
    status: canonicalStatus,
    currentStatus: canonicalStatus,
    tamperSealIds: sealIds,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.manifests.set(manifest.id, manifest);

  // Maintain Stage 02 State:
  // Trip remains PACKAGES_LINKED (never DISPATCHED here)
  trip.allocatedWeightKg = totalWeight;
  trip.manifestId = manifest.id;
  if (trip.status !== 'DISPATCHED' && trip.status !== 'COMPLETED') {
    trip.status = 'PACKAGES_LINKED';
  }
  db.trips.set(trip.id, trip);

  // Shipments remain ASSIGNED_TO_TRIP (never IN_TRANSIT here)
  packages.forEach((s) => {
    s.assignedTripId = trip.id;
    s.assignedTravelerId = trip.travelerId;
    s.assignedTravelerName = trip.travelerName;
    s.flightNumber = trip.flightNumber;
    s.airline = trip.airline;
    if (s.currentStatus !== 'IN_TRANSIT' && s.currentStatus !== 'DELIVERED') {
      s.currentStatus = 'ASSIGNED_TO_TRIP';
    }
    s.updatedAt = new Date().toISOString();
    db.shipments.set(s.id, s);
  });

  db.logAudit({
    actorId: agentId || 'usr-agent-303',
    actorName: 'Hub Agent',
    actorRole: 'HUB_AGENT',
    domain: 'Manifest',
    action: 'CREATE_DRAFT_MANIFEST',
    resourceType: 'Manifest',
    resourceId: manifest.id,
    details: {
      manifestId: manifest.id,
      tripId: trip.id,
      travelerName: trip.travelerName,
      totalPackages: packages.length,
      totalWeightKg: totalWeight,
      status: canonicalStatus,
    },
  });

  res.status(201).json({
    success: true,
    message: `Draft manifest [${manifest.id}] created successfully. Shipments linked and ready for inspection.`,
    manifest,
  });
});

// PUT update manifest (Stage 02: Add/Remove packages while DRAFT)
manifestsRouter.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const manifest = db.manifests.get(id);

  if (!manifest) {
    return res.status(404).json({ success: false, error: 'Manifest not found' });
  }

  // Prevent modifying locked manifests
  if (manifest.status === 'READY' || manifest.status === 'HANDED_OVER' || manifest.status === 'IN_TRANSIT') {
    return res.status(400).json({ success: false, error: 'Manifest contents are locked and cannot be modified.' });
  }

  const { shipmentIds, totalWeightKg, agentId } = req.body;

  if (Array.isArray(shipmentIds)) {
    const packages = Array.from(db.shipments.values()).filter((s) => shipmentIds.includes(s.id));
    manifest.shipmentIds = shipmentIds;
    manifest.totalPackages = shipmentIds.length;
    manifest.totalShipmentsCount = shipmentIds.length;
    manifest.totalWeightKg = totalWeightKg !== undefined
      ? Number(totalWeightKg)
      : Number(packages.reduce((sum, p) => sum + (p.actualWeightKg || p.estimatedWeightKg || 0), 0).toFixed(2));
    manifest.tamperSealIds = packages.map((p) => p.securitySealId).filter(Boolean) as string[];
  }

  manifest.updatedAt = new Date().toISOString();
  db.manifests.set(manifest.id, manifest);

  db.logAudit({
    actorId: agentId || 'usr-agent-303',
    actorName: 'Hub Agent',
    actorRole: 'HUB_AGENT',
    domain: 'Manifest',
    action: 'UPDATE_DRAFT_MANIFEST',
    resourceType: 'Manifest',
    resourceId: manifest.id,
    details: {
      totalPackages: manifest.totalPackages,
      totalWeightKg: manifest.totalWeightKg,
    },
  });

  res.json({
    success: true,
    message: 'Draft manifest updated successfully.',
    manifest,
  });
});

// POST Mark Manifest READY (Stage 02 Final Step: Locks contents, generates handover token)
manifestsRouter.post('/:id/mark-ready', (req: Request, res: Response) => {
  const { id } = req.params;
  const { agentId } = req.body;
  const manifest = db.manifests.get(id);

  if (!manifest) {
    return res.status(404).json({ success: false, error: 'Manifest not found' });
  }

  const trip = db.trips.get(manifest.tripId);
  if (!trip) {
    return res.status(404).json({ success: false, error: 'Trip not found' });
  }

  // Validate Capacity Guard
  if (manifest.totalWeightKg > trip.availableWeightKg) {
    return res.status(400).json({
      success: false,
      error: `Manifest weight (${manifest.totalWeightKg} KG) exceeds trip capacity (${trip.availableWeightKg} KG)`,
    });
  }

  // Generate HMAC Cryptographic Handover Token
  const handoverToken = generateCryptographicHandoverToken({
    manifestId: manifest.id,
    travelerId: trip.travelerId,
    agentId: agentId || 'usr-agent-303',
    totalWeightKg: manifest.totalWeightKg,
    packageCount: manifest.shipmentIds.length,
    timestamp: new Date().toISOString(),
  });

  // Stage 02 Strict State Update:
  // Manifest: READY
  // Trip: PACKAGES_LINKED (NOT DISPATCHED)
  // Shipment: ASSIGNED_TO_TRIP (NOT IN_TRANSIT)
  manifest.status = 'READY';
  manifest.currentStatus = 'READY';
  manifest.handoverQrSecret = handoverToken;
  manifest.handoverToken = handoverToken;
  manifest.updatedAt = new Date().toISOString();
  db.manifests.set(manifest.id, manifest);

  trip.status = 'PACKAGES_LINKED';
  db.trips.set(trip.id, trip);

  db.logAudit({
    actorId: agentId || 'usr-agent-303',
    actorName: 'Hub Agent',
    actorRole: 'HUB_AGENT',
    domain: 'Manifest',
    action: 'MARK_MANIFEST_READY',
    resourceType: 'Manifest',
    resourceId: manifest.id,
    details: {
      manifestId: manifest.id,
      tripId: trip.id,
      totalPackages: manifest.totalPackages,
      totalWeightKg: manifest.totalWeightKg,
      handoverToken,
    },
  });

  res.json({
    success: true,
    message: 'Manifest marked READY and locked for traveler handover.',
    manifest,
    handoverToken,
  });
});

// Handover Dispatch endpoint alias (Stage 03 — Final Handover: Manifest HANDED_OVER, Trip DISPATCHED, Shipments IN_TRANSIT)
manifestsRouter.post('/:id/handover-dispatch', (req: Request, res: Response) => {
  const { id } = req.params;
  const { agentId, agentName } = req.body;
  const manifest = db.manifests.get(id);

  if (!manifest) {
    return res.status(404).json({ success: false, error: 'Manifest not found' });
  }

  manifest.status = 'HANDED_OVER';
  manifest.currentStatus = 'HANDED_OVER';
  (manifest as any).custody = 'TRAVELER';
  manifest.dispatchedByAgentId = agentId || manifest.dispatchedByAgentId;
  manifest.dispatchTimestamp = new Date().toISOString();
  manifest.updatedAt = new Date().toISOString();
  db.manifests.set(manifest.id, manifest);

  const trip = db.trips.get(manifest.tripId);
  if (trip) {
    trip.status = 'DISPATCHED';
    db.trips.set(trip.id, trip);
  }

  // Update all shipments in manifest to IN_TRANSIT
  const shipmentIds = manifest.shipmentIds || [];
  shipmentIds.forEach((sId) => {
    const s = db.shipments.get(sId);
    if (s) {
      s.currentStatus = 'IN_TRANSIT';
      s.updatedAt = new Date().toISOString();
      db.shipments.set(s.id, s);
    }
  });

  db.logAudit({
    actorId: agentId || 'usr-agent-303',
    actorName: agentName || 'Hub Agent',
    actorRole: 'HUB_AGENT',
    domain: 'Manifest',
    action: 'COMPLETE_TRAVELER_HANDOVER',
    resourceType: 'Manifest',
    resourceId: manifest.id,
    details: {
      manifestId: manifest.id,
      tripId: manifest.tripId,
      travelerId: manifest.travelerId,
      packageCount: manifest.shipmentIds.length,
      totalWeightKg: manifest.totalWeightKg,
      custody: 'TRAVELER',
    },
  });

  res.json({
    success: true,
    message: `Manifest ${manifest.manifestCode || manifest.id} handed over successfully. Custody transferred to traveler.`,
    manifest,
  });
});

// POST Destination Intake endpoint (Stage 04 — Destination Intake)
// Strict State Logic:
// 1. Success case:
//    - Shipment: RECEIVED_AT_DEST
//    - Trip: COMPLETED
//    - Manifest: CLOSED
//    - Custody: DESTINATION_HUB
//    - Escrow release and traveler payout executed
// 2. Discrepancy case (Missing package, seal mismatch, damaged, or explicit status === 'DISCREPANCY'):
//    - Manifest: DISCREPANCY
//    - Trip: NOT COMPLETED (remains DISPATCHED or ARRIVED)
//    - Affected Shipment: NOT blindly changed to RECEIVED_AT_DEST (remains IN_TRANSIT)
//    - Custody: remains explicit according to actually received package state
//    - Escrow release and traveler payout held pending investigation
manifestsRouter.post('/:id/destination-intake', (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    qrToken,
    agentId,
    agentName,
    status: requestedStatus,
    verifiedShipmentIds = [],
    missingShipmentIds = [],
    sealMismatchIds = [],
    damagedShipmentIds = [],
    notes = '',
  } = req.body;

  let manifest = db.manifests.get(id);

  if (!manifest && qrToken) {
    const verification = verifyCryptographicHandoverToken(qrToken);
    if (verification.isValid && verification.payload) {
      manifest = db.manifests.get(verification.payload.manifestId);
    }
  }

  if (!manifest) {
    return res.status(404).json({ success: false, error: 'Manifest not found' });
  }

  const isDiscrepancy =
    requestedStatus === 'DISCREPANCY' ||
    (Array.isArray(missingShipmentIds) && missingShipmentIds.length > 0) ||
    (Array.isArray(sealMismatchIds) && sealMismatchIds.length > 0) ||
    (Array.isArray(damagedShipmentIds) && damagedShipmentIds.length > 0);

  const now = new Date().toISOString();

  if (!isDiscrepancy) {
    // ==========================================
    // SUCCESS CASE (No Discrepancies)
    // ==========================================
    // 1. Manifest -> CLOSED, Custody -> DESTINATION_HUB
    manifest.status = 'CLOSED';
    manifest.currentStatus = 'CLOSED';
    (manifest as any).custody = 'DESTINATION_HUB';
    manifest.receivedByAgentId = agentId || 'usr-manager-404';
    manifest.receiptTimestamp = now;
    manifest.updatedAt = now;
    (manifest as any).intakeNotes = notes;
    db.manifests.set(manifest.id, manifest);

    // 2. Shipments -> RECEIVED_AT_DEST (Stage 04 exact requirement)
    manifest.shipmentIds.forEach((shipId) => {
      const s = db.shipments.get(shipId);
      if (s) {
        s.currentStatus = 'RECEIVED_AT_DEST';
        (s as any).custody = 'DESTINATION_HUB';
        s.updatedAt = now;
        db.shipments.set(s.id, s);
      }
    });

    // 3. Trip -> COMPLETED
    const trip = db.trips.get(manifest.tripId);
    if (trip) {
      trip.status = 'COMPLETED';
      db.trips.set(trip.id, trip);

      // Escrow Release & Traveler Payout
      const travelerWallet = db.wallets.get(trip.travelerId);
      if (travelerWallet) {
        const depositToUnlock = trip.requiredEscrowDeposit;
        travelerWallet.lockedEscrowDeposit = Math.max(0, Number((travelerWallet.lockedEscrowDeposit - depositToUnlock).toFixed(2)));
        travelerWallet.balance = Number((travelerWallet.balance + depositToUnlock).toFixed(2));

        const payoutAmount = trip.totalEarningsEstimated;
        travelerWallet.balance = Number((travelerWallet.balance + payoutAmount).toFixed(2));
        travelerWallet.pendingEarnings = Math.max(0, Number((travelerWallet.pendingEarnings - payoutAmount).toFixed(2)));
        travelerWallet.updatedAt = now;
        db.wallets.set(travelerWallet.userId, travelerWallet);

        db.recordTransaction({
          transactionCode: `TXN-REL-${Date.now().toString().slice(-6)}`,
          walletId: travelerWallet.id,
          userId: trip.travelerId,
          userName: trip.travelerName,
          tripId: trip.id,
          type: 'ESCROW_RELEASE',
          amount: depositToUnlock,
          currency: 'USD',
          exchangeRateToUsd: 1.0,
          idempotencyKey: `idemp-rel-dest-${trip.id}`,
          status: 'COMMITTED',
          referenceNote: `Refundable escrow security deposit released upon verified delivery to destination hub (${manifest.manifestCode || manifest.id})`,
        });

        db.recordTransaction({
          transactionCode: `TXN-PAY-${Date.now().toString().slice(-6)}`,
          walletId: travelerWallet.id,
          userId: trip.travelerId,
          userName: trip.travelerName,
          tripId: trip.id,
          type: 'TRAVELER_PAYOUT',
          amount: payoutAmount,
          currency: 'USD',
          exchangeRateToUsd: 1.0,
          idempotencyKey: `idemp-pay-dest-${trip.id}`,
          status: 'COMMITTED',
          referenceNote: `Traveler luggage delivery earnings payout for ${manifest.totalPackages || manifest.shipmentIds.length} packages (${manifest.totalWeightKg} kg)`,
        });

        const escrowNotif = db.pushNotification({
          type: 'ESCROW_RELEASED',
          titleAr: 'تحرير وديعة الضمان وصرف الأرباح',
          titleEn: 'Escrow Released & Payout Credited',
          messageAr: `تم استلام الشحنات (${manifest.manifestCode || manifest.id}) في فرع الوجهة بنجاح. تم تحرير وديعة التأمين ($${depositToUnlock}) وإيداع أرباحك ($${payoutAmount}) في محفظتك.`,
          messageEn: `Shipments for manifest ${manifest.manifestCode || manifest.id} successfully delivered. Security deposit ($${depositToUnlock}) released and $${payoutAmount} credited to your wallet.`,
          targetRole: 'TRAVELER',
          targetUserId: trip.travelerId,
          referenceId: trip.id,
          priority: 'HIGH',
        });
        broadcastNotification(escrowNotif);
      }

      // Push Shipment Arrived at Destination notification
      const arrivalNotif = db.pushNotification({
        type: 'SHIPMENT_ARRIVED',
        titleAr: 'وصول الشحنات إلى فرع الوجهة',
        titleEn: 'Shipments Received at Destination Hub',
        messageAr: `وصلت شحنات المانيفست (${manifest.manifestCode || manifest.id}) إلى فرع الوجهة بحالة ممتازة وتم تأكيد الاستلام (RECEIVED_AT_DEST).`,
        messageEn: `Shipments under manifest ${manifest.manifestCode || manifest.id} have been safely received at destination hub (RECEIVED_AT_DEST).`,
        targetRole: 'MASTER_ADMIN',
        referenceId: manifest.id,
        priority: 'HIGH',
      });
      broadcastNotification(arrivalNotif);
    }

    db.logAudit({
      actorId: agentId || 'usr-manager-404',
      actorName: agentName || 'Destination Hub Agent',
      actorRole: 'HUB_AGENT',
      domain: 'Manifest',
      action: 'COMPLETE_DESTINATION_INTAKE_SUCCESS',
      resourceType: 'Manifest',
      resourceId: manifest.id,
      details: {
        manifestId: manifest.id,
        tripId: manifest.tripId,
        packageCount: manifest.shipmentIds.length,
        status: 'CLOSED',
        custody: 'DESTINATION_HUB',
      },
    });

    return res.json({
      success: true,
      status: 'CLOSED',
      message: `Destination intake verified successfully! ${manifest.totalPackages || manifest.shipmentIds.length} packages received. Trip completed.`,
      manifest,
    });
  } else {
    // ==========================================
    // DISCREPANCY CASE
    // ==========================================
    // 1. Manifest -> DISCREPANCY
    manifest.status = 'DISCREPANCY';
    manifest.currentStatus = 'DISCREPANCY';
    (manifest as any).custody = 'DESTINATION_HUB';
    manifest.receivedByAgentId = agentId || 'usr-manager-404';
    manifest.receiptTimestamp = now;
    manifest.updatedAt = now;
    (manifest as any).intakeNotes = notes;
    db.manifests.set(manifest.id, manifest);

    // 2. Trip -> NOT COMPLETED (remains DISPATCHED or ARRIVED)
    const trip = db.trips.get(manifest.tripId);
    // Escrow and payout are NOT released!

    // 3. Shipments:
    // Affected / Missing shipments: NOT blindly changed to RECEIVED_AT_DEST (keep previous status IN_TRANSIT)
    const missingSet = new Set(missingShipmentIds);
    const verifiedSet = new Set(
      verifiedShipmentIds.length > 0 ? verifiedShipmentIds : manifest.shipmentIds.filter((id) => !missingSet.has(id))
    );

    manifest.shipmentIds.forEach((shipId) => {
      const s = db.shipments.get(shipId);
      if (s) {
        if (missingSet.has(shipId)) {
          (s as any).discrepancyNote = 'Missing package during destination hub intake verification';
          s.updatedAt = now;
          db.shipments.set(s.id, s);
        } else if (verifiedSet.has(shipId)) {
          s.currentStatus = 'RECEIVED_AT_DEST';
          (s as any).custody = 'DESTINATION_HUB';
          s.updatedAt = now;
          db.shipments.set(s.id, s);
        }
      }
    });

    // 4. Create Notification / Incident for Operations
    const discrepancyNotif = db.pushNotification({
      type: 'SYSTEM_ALERT',
      titleAr: 'تنبيه: تسجيل فروقات في استلام المانيفست بالوجهة',
      titleEn: 'Alert: Manifest Destination Intake Discrepancy',
      messageAr: `تم تسجيل فروقات في المانيفست (${manifest.manifestCode || manifest.id}). طرود مفقودة: ${missingShipmentIds.length}، أختام غير متطابقة: ${sealMismatchIds.length}. تم تجميد رحلة المسافر ولم يتم تحويل الأرباح.`,
      messageEn: `Discrepancy flagged during destination intake of manifest ${manifest.manifestCode || manifest.id}. Missing: ${missingShipmentIds.length}, Seal Mismatch: ${sealMismatchIds.length}. Trip completion and payout held.`,
      targetRole: 'MASTER_ADMIN',
      referenceId: manifest.id,
      priority: 'HIGH',
    });
    broadcastNotification(discrepancyNotif);

    db.logAudit({
      actorId: agentId || 'usr-manager-404',
      actorName: agentName || 'Destination Hub Agent',
      actorRole: 'HUB_AGENT',
      domain: 'Manifest',
      action: 'DESTINATION_INTAKE_DISCREPANCY_FLAGGED',
      resourceType: 'Manifest',
      resourceId: manifest.id,
      details: {
        manifestId: manifest.id,
        tripId: manifest.tripId,
        missingShipmentIds,
        sealMismatchIds,
        damagedShipmentIds,
        status: 'DISCREPANCY',
        tripStatus: trip?.status,
        notes,
      },
    });

    return res.json({
      success: true,
      status: 'DISCREPANCY',
      message: `Destination intake flagged with discrepancies. Missing: ${missingShipmentIds.length}, Mismatches: ${sealMismatchIds.length}. Trip kept open pending investigation.`,
      manifest,
      tripStatus: trip?.status || 'DISPATCHED',
    });
  }
});
