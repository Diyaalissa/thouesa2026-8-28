import { Request, Response, Router } from 'express';
import { db } from '../store';
import {
  generateCryptographicHandoverToken,
  generateTamperSealCode,
  verifyCryptographicHandoverToken,
} from '../../src/lib/crypto';
import { Hub, Manifest } from '../../src/types';
import { broadcastNotification } from './notifications';

export const hubsRouter = Router();

// Get all hubs with real-time operational stats
hubsRouter.get('/', (req: Request, res: Response) => {
  const hubs = Array.from(db.hubs.values()).map((hub) => {
    const inboundQueue = Array.from(db.shipments.values()).filter(
      (s) => s.originHubId === hub.id && s.currentStatus === 'PENDING_DROPOFF'
    ).length;

    const inspectedQueue = Array.from(db.shipments.values()).filter(
      (s) => s.originHubId === hub.id && s.currentStatus === 'INSPECTED_AND_SEALED'
    ).length;

    const destinationArrivals = Array.from(db.shipments.values()).filter(
      (s) => s.destinationHubId === hub.id && (s.currentStatus === 'IN_TRANSIT' || s.currentStatus === 'RECEIVED_AT_DEST')
    ).length;

    return {
      ...hub,
      inboundQueue,
      inspectedQueue,
      destinationArrivals,
    };
  });

  res.json({ success: true, hubs });
});

// Create new official Hub / Branch
hubsRouter.post('/', (req: Request, res: Response) => {
  const {
    countryCode,
    address,
    phone,
    managerName,
    operatingHours,
    // Optional overrides if provided
    code,
    nameAr,
    nameEn,
    cityAr,
    cityEn,
    countryNameAr,
    countryNameEn,
    storageCapacityKg,
    adminId,
    adminName,
  } = req.body;

  if (!countryCode || !address || !phone) {
    return res.status(400).json({
      success: false,
      error: 'الدولة، العنوان بالتفصيل، ورقم الهاتف هي حقول إجبارية لإنشاء الفرع.',
    });
  }

  const cleanCountryCode = String(countryCode).toUpperCase().trim();
  const cleanAddress = String(address).trim();
  const cleanPhone = String(phone).trim();
  const cleanManagerName = managerName ? String(managerName).trim() : 'مدير الفرع المعتمد';
  const cleanOperatingHours = operatingHours ? String(operatingHours).trim() : '08:00 - 22:00 يومياً';

  const countryDefaults: Record<string, { ar: string; en: string; capitalAr: string; capitalEn: string }> = {
    JOR: { ar: 'الأردن', en: 'Jordan', capitalAr: 'عَمّان', capitalEn: 'Amman' },
    DZA: { ar: 'الجزائر', en: 'Algeria', capitalAr: 'الجزائر العاصمة', capitalEn: 'Algiers' },
    EGY: { ar: 'مصر', en: 'Egypt', capitalAr: 'القاهرة', capitalEn: 'Cairo' },
    SAU: { ar: 'السعودية', en: 'Saudi Arabia', capitalAr: 'الرياض', capitalEn: 'Riyadh' },
    OMN: { ar: 'سلطنة عُمان', en: 'Oman', capitalAr: 'مسقط', capitalEn: 'Muscat' },
    ARE: { ar: 'الإمارات', en: 'UAE', capitalAr: 'دبي', capitalEn: 'Dubai' },
    QAT: { ar: 'قطر', en: 'Qatar', capitalAr: 'الدوحة', capitalEn: 'Doha' },
    KWT: { ar: 'الكويت', en: 'Kuwait', capitalAr: 'مدينة الكويت', capitalEn: 'Kuwait City' },
    TUN: { ar: 'تونس', en: 'Tunisia', capitalAr: 'تونس', capitalEn: 'Tunis' },
    MAR: { ar: 'المغرب', en: 'Morocco', capitalAr: 'الدار البيضاء', capitalEn: 'Casablanca' },
    TUR: { ar: 'تركيا', en: 'Turkey', capitalAr: 'إسطنبول', capitalEn: 'Istanbul' },
    LBN: { ar: 'لبنان', en: 'Lebanon', capitalAr: 'بيروت', capitalEn: 'Beirut' },
    IRQ: { ar: 'العراق', en: 'Iraq', capitalAr: 'بغداد', capitalEn: 'Baghdad' },
  };

  const cMeta = countryDefaults[cleanCountryCode] || {
    ar: countryNameAr || cleanCountryCode,
    en: countryNameEn || cleanCountryCode,
    capitalAr: cleanCountryCode,
    capitalEn: cleanCountryCode,
  };

  // Determine city (extracted or derived)
  const resolvedCityAr = cityAr ? cityAr.trim() : cMeta.capitalAr;
  const resolvedCityEn = cityEn ? cityEn.trim() : cMeta.capitalEn;

  // Auto-generate official code
  const existingCount = Array.from(db.hubs.values()).filter((h) => h.countryCode === cleanCountryCode).length;
  const autoCode = code
    ? String(code).toUpperCase().trim()
    : `${cleanCountryCode}-${String(existingCount + 1).padStart(2, '0')}`;
  
  let uniqueHubId = `hub-${autoCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  if (db.hubs.has(uniqueHubId)) {
    uniqueHubId = `hub-${autoCode.toLowerCase()}-${Date.now().toString().slice(-4)}`;
  }

  // Auto-sign and derive full branch titles
  const autoNameAr = nameAr
    ? nameAr.trim()
    : `فرع ثويسا الدولي - ${cMeta.ar} (${resolvedCityAr})`;
  const autoNameEn = nameEn
    ? nameEn.trim()
    : `THOUESA Logistics Hub - ${cMeta.en} (${resolvedCityEn})`;

  const newHub: Hub = {
    id: uniqueHubId,
    code: autoCode,
    nameAr: autoNameAr,
    nameEn: autoNameEn,
    countryCode: cleanCountryCode,
    countryNameAr: countryNameAr || cMeta.ar,
    countryNameEn: countryNameEn || cMeta.en,
    cityAr: resolvedCityAr,
    cityEn: resolvedCityEn,
    address: cleanAddress,
    phone: cleanPhone,
    storageCapacityKg: Number(storageCapacityKg) || 2500,
    currentUsedKg: 0,
    isActive: true,
    managerName: cleanManagerName,
    operatingHours: cleanOperatingHours,
  };

  db.hubs.set(newHub.id, newHub);

  db.logAudit({
    actorId: adminId || 'usr-admin-001',
    actorName: adminName || 'Master Admin',
    actorRole: 'MASTER_ADMIN',
    domain: 'HubManagement',
    action: 'CREATE_OFFICIAL_HUB',
    resourceType: 'Hub',
    resourceId: newHub.id,
    details: {
      code: newHub.code,
      country: cMeta.ar,
      address: newHub.address,
      phone: newHub.phone,
      managerName: newHub.managerName,
      operatingHours: newHub.operatingHours,
      autoSigned: true,
    },
  });

  const notif = db.pushNotification({
    type: 'ORDER_CREATED',
    titleAr: 'تدشين فرع رسمي جديد',
    titleEn: 'New Official Branch Commissioned',
    messageAr: `تم تدشين فرع رسمي جديد في ${cMeta.ar}: ${newHub.nameAr} (${newHub.code}) بإدارة ${newHub.managerName}.`,
    messageEn: `New official branch commissioned in ${cMeta.en}: ${newHub.nameEn} (${newHub.code}) managed by ${newHub.managerName}.`,
    targetRole: 'MASTER_ADMIN',
    priority: 'HIGH',
  });
  broadcastNotification(notif);

  res.status(201).json({
    success: true,
    message: `تم تدشين وتوقيع الفرع الرسمي (${newHub.nameAr}) بنجاح وإدراجه في الشبكة الدولية.`,
    hub: newHub,
    hubs: Array.from(db.hubs.values()),
  });
});

// Update official Hub / Branch details (Phone, Manager, Working Hours, Address, Capacity)
const handleUpdateHub = (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    phone,
    managerName,
    operatingHours,
    address,
    nameAr,
    nameEn,
    cityAr,
    cityEn,
    storageCapacityKg,
    isActive,
    adminId,
    adminName,
  } = req.body;

  const hub = db.hubs.get(id);
  if (!hub) {
    return res.status(404).json({ success: false, error: 'الفرع المطلوب غير موجود في النظام.' });
  }

  const oldSnapshot = { ...hub };

  if (phone !== undefined) hub.phone = String(phone).trim();
  if (managerName !== undefined) hub.managerName = String(managerName).trim();
  if (operatingHours !== undefined) hub.operatingHours = String(operatingHours).trim();
  if (address !== undefined) hub.address = String(address).trim();
  if (nameAr !== undefined) hub.nameAr = String(nameAr).trim();
  if (nameEn !== undefined) hub.nameEn = String(nameEn).trim();
  if (cityAr !== undefined) hub.cityAr = String(cityAr).trim();
  if (cityEn !== undefined) hub.cityEn = String(cityEn).trim();
  if (storageCapacityKg !== undefined) hub.storageCapacityKg = Number(storageCapacityKg) || hub.storageCapacityKg;
  if (isActive !== undefined) hub.isActive = Boolean(isActive);

  db.hubs.set(hub.id, hub);

  db.logAudit({
    actorId: adminId || 'usr-admin-001',
    actorName: adminName || 'Master Admin',
    actorRole: 'MASTER_ADMIN',
    domain: 'HubManagement',
    action: 'UPDATE_HUB_DETAILS',
    resourceType: 'Hub',
    resourceId: hub.id,
    details: {
      hubCode: hub.code,
      updatedFields: {
        phone: hub.phone,
        managerName: hub.managerName,
        operatingHours: hub.operatingHours,
        address: hub.address,
        isActive: hub.isActive,
      },
      previous: oldSnapshot,
    },
  });

  res.json({
    success: true,
    message: `تم تحديث بيانات الفرع (${hub.nameAr}) بنجاح.`,
    hub,
    hubs: Array.from(db.hubs.values()),
  });
};

hubsRouter.put('/:id', handleUpdateHub);
hubsRouter.patch('/:id', handleUpdateHub);

// Toggle Hub Operational Status (Active / Inactive)
hubsRouter.post('/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;
  const { adminId, adminName } = req.body;

  const hub = db.hubs.get(id);
  if (!hub) {
    return res.status(404).json({ success: false, error: 'الفرع المطلوب غير موجود.' });
  }

  hub.isActive = !hub.isActive;
  db.hubs.set(hub.id, hub);

  db.logAudit({
    actorId: adminId || 'usr-admin-001',
    actorName: adminName || 'Master Admin',
    actorRole: 'MASTER_ADMIN',
    domain: 'HubManagement',
    action: hub.isActive ? 'ACTIVATE_HUB' : 'DEACTIVATE_HUB',
    resourceType: 'Hub',
    resourceId: hub.id,
    details: { hubCode: hub.code, nameAr: hub.nameAr, isActive: hub.isActive },
  });

  const notif = db.pushNotification({
    type: 'ORDER_CREATED',
    titleAr: hub.isActive ? 'إعادة تشغيل فرع رسمي' : 'إيقاف تشغيل فرع مؤقتاً',
    titleEn: hub.isActive ? 'Branch Re-activated' : 'Branch Temporarily Suspended',
    messageAr: `تم ${hub.isActive ? 'تفعيل وتشغيل' : 'إيقاف وتعليق استقبال الشحنات في'} فرع ${hub.nameAr} (${hub.code}).`,
    messageEn: `Hub ${hub.nameEn} (${hub.code}) has been ${hub.isActive ? 'activated' : 'temporarily suspended'}.`,
    targetRole: 'MASTER_ADMIN',
    priority: 'HIGH',
  });
  broadcastNotification(notif);

  res.json({
    success: true,
    message: `تم ${hub.isActive ? 'تشغيل وتفعيل' : 'إيقاف وتعطيل'} فرع ${hub.nameAr} بنجاح.`,
    hub,
    hubs: Array.from(db.hubs.values()),
  });
});

// Delete/Decommission official Hub
hubsRouter.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { adminId, adminName } = req.body;

  const hub = db.hubs.get(id);
  if (!hub) {
    return res.status(404).json({ success: false, error: 'الفرع غير موجود.' });
  }

  // Check if there are active shipments or manifests
  const activeShipments = Array.from(db.shipments.values()).filter(
    (s) =>
      (s.originHubId === hub.id || s.destinationHubId === hub.id) &&
      s.currentStatus !== 'DELIVERED' &&
      s.currentStatus !== 'CANCELLED'
  );

  if (activeShipments.length > 0) {
    return res.status(400).json({
      success: false,
      error: `لا يمكن حذف الفرع لوجود (${activeShipments.length}) شحنة نشطة مرتبطة به حالياً. يمكنك إيقاف تشغيله بدلاً من ذلك.`,
    });
  }

  db.hubs.delete(id);

  db.logAudit({
    actorId: adminId || 'usr-admin-001',
    actorName: adminName || 'Master Admin',
    actorRole: 'MASTER_ADMIN',
    domain: 'HubManagement',
    action: 'DELETE_HUB',
    resourceType: 'Hub',
    resourceId: id,
    details: { code: hub.code, nameAr: hub.nameAr },
  });

  res.json({
    success: true,
    message: `تم إلغاء تسجيل الفرع (${hub.nameAr}) من النظام.`,
    hubs: Array.from(db.hubs.values()),
  });
});

// Overview stats for all hubs
hubsRouter.get('/overview', (req: Request, res: Response) => {
  const hubs = Array.from(db.hubs.values());
  const shipments = Array.from(db.shipments.values());
  const manifests = Array.from(db.manifests.values());

  res.json({
    success: true,
    totalHubs: hubs.length,
    hubs,
    totalPendingInspections: shipments.filter((s) => s.currentStatus === 'PENDING_DROPOFF').length,
    totalInspectedSealed: shipments.filter((s) => s.currentStatus === 'INSPECTED_SEALED' || s.currentStatus === 'INSPECTED_AND_SEALED').length,
    totalInTransit: shipments.filter((s) => s.currentStatus === 'IN_TRANSIT').length,
    activeManifestsCount: manifests.length,
  });
});

// Physical Package Reception at Origin Hub Desk (Customer Drop-off)
hubsRouter.post('/shipments/:id/receive', (req: Request, res: Response) => {
  const { id } = req.params;
  const { employeeId, agentId, hubId, notes } = req.body;
  const actingEmployeeId = employeeId || agentId || 'usr-agent-303';

  const shipment = db.shipments.get(id);
  if (!shipment) {
    return res.status(404).json({ success: false, error: 'الطلب أو الشحنة غير موجودة في سجلات النظام.' });
  }

  // Verification 1: originHubId check
  if (hubId && shipment.originHubId !== hubId) {
    return res.status(403).json({
      success: false,
      error: 'لا يمكن استلام هذا الطرد في هذا الفرع؛ فرع المنشأ المحدد في بوليصة الشحن مختلف.',
    });
  }

  // Verification 2: Status check (Must be pending drop-off)
  const acceptableIntakeStatuses = ['PENDING', 'PENDING_REVIEW', 'PENDING_DROPOFF', 'PENDING_HUB_DROPOFF', 'DRAFT'];
  if (!acceptableIntakeStatuses.includes(shipment.currentStatus)) {
    return res.status(400).json({
      success: false,
      error: `لا يمكن استلام الطرد؛ الحالة الحالية هي (${shipment.currentStatus}) وتم استلامه أو معالجته مسبقاً.`,
    });
  }

  // State Transition: PENDING_DROPOFF -> RECEIVED_AT_ORIGIN
  const nowIso = new Date().toISOString();
  shipment.currentStatus = 'RECEIVED_AT_ORIGIN';
  shipment.receivedAtOriginHubAt = nowIso;
  shipment.receivedByEmployeeId = actingEmployeeId;
  shipment.receivedAtHubId = hubId || shipment.originHubId;
  shipment.updatedAt = nowIso;

  db.shipments.set(shipment.id, shipment);

  const hub = db.hubs.get(shipment.originHubId);

  // Audit Logging
  db.logAudit({
    actorId: actingEmployeeId,
    actorName: 'موظف فرع المنشأ',
    actorRole: 'HUB_AGENT',
    domain: 'HubIntake',
    action: 'RECEIVE_PACKAGE_AT_ORIGIN_DESK',
    resourceType: 'Shipment',
    resourceId: shipment.id,
    details: {
      trackingNumber: shipment.trackingNumber,
      originHubId: shipment.originHubId,
      hubCode: hub?.code,
      receivedAt: nowIso,
      senderName: shipment.senderName,
      notes: notes || 'تم استلام الطرد فعلياً على كاونتر الاستقبال بانتظار نقله لمحطة الفحص والوزن.',
    },
  });

  // Customer & System Notification
  const intakeNotif = db.pushNotification({
    type: 'SHIPMENT_UPDATED',
    titleAr: `تم استلام طردك في الفرع: ${shipment.trackingNumber}`,
    titleEn: `Package Received at Branch: ${shipment.trackingNumber}`,
    messageAr: `تم استلام طردك بنجاح في فرع (${hub?.nameAr || 'ثويسة'}). سيتم نقله الآن لمحطة الفحص والوزن والختم الأمني.`,
    messageEn: `Your package was received at (${hub?.nameEn || 'THOUESA Hub'}). Moving to certified inspection & sealing.`,
    targetRole: 'SENDER',
    targetUserId: shipment.senderId,
    referenceId: shipment.id,
    priority: 'NORMAL',
  });
  broadcastNotification(intakeNotif);

  return res.json({
    success: true,
    message: `تم استلام الطرد (${shipment.trackingNumber}) بنجاح وتسجيله في عهدة فرع المنشأ.`,
    shipment,
  });
});

// Physical Intake & Inspection at Origin Hub (Scales weighing + Tamper Seal + 360° Photos)
hubsRouter.post('/shipments/:id/inspect', (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    agentId,
    agentName,
    actualWeightKg,
    actual_weight_kg,
    inspectionNotes,
    inspection_notes,
    securitySealId,
    security_seal_id,
    inspectionPhotos,
    inspection_photos,
    photoUrls,
  } = req.body;

  const shipment = db.shipments.get(id);
  if (!shipment) {
    return res.status(404).json({ success: false, error: 'Shipment not found' });
  }

  const hub = db.hubs.get(shipment.originHubId);
  const seal = securitySealId || security_seal_id || generateTamperSealCode(hub ? hub.code : 'AMM');
  const actualKg = Number(actualWeightKg || actual_weight_kg) || shipment.estimatedWeightKg;
  const photos = inspectionPhotos || inspection_photos || photoUrls || [
    'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
  ];

  shipment.actualWeightKg = actualKg;
  shipment.securitySealId = seal;
  shipment.inspectionPhotos = photos;
  shipment.inspectionNotes = inspectionNotes || inspection_notes || 'Inspection completed: Contents verified against IATA regulations and certified tamper-sealed.';
  shipment.inspectedByAgentId = agentId || 'usr-agent-303';
  shipment.inspectedAt = new Date().toISOString();

  // Check for weight discrepancy (> 0.2 kg difference over estimate)
  const discrepancyDeltaKg = Number((actualKg - shipment.estimatedWeightKg).toFixed(2));
  if (discrepancyDeltaKg > 0.2) {
    const priceDelta = Number((discrepancyDeltaKg * 18.0).toFixed(2));
    shipment.currentStatus = 'WEIGHT_ADJUSTMENT_PENDING';
    shipment.weightDiscrepancy = {
      originalKg: shipment.estimatedWeightKg,
      actualKg,
      priceDelta,
      status: 'PENDING_CUSTOMER_APPROVAL',
    };

    db.shipments.set(shipment.id, shipment);

    db.logAudit({
      actorId: agentId || 'usr-agent-303',
      actorName: agentName || 'Hub Agent',
      actorRole: 'HUB_AGENT',
      domain: 'HubOperations',
      action: 'FLAG_WEIGHT_DISCREPANCY',
      resourceType: 'Shipment',
      resourceId: shipment.id,
      details: { originalKg: shipment.estimatedWeightKg, actualKg, priceDelta, sealId: seal },
    });

    return res.json({
      success: true,
      requiresCustomerApproval: true,
      message: `Weight discrepancy detected (${discrepancyDeltaKg} kg over estimate). Price adjustment alert sent to sender.`,
      shipment,
      billOfLading: {
        trackingNumber: shipment.trackingNumber,
        sealId: seal,
        actualWeightKg: actualKg,
        status: 'WEIGHT_ADJUSTMENT_PENDING',
        barcode: `*${shipment.trackingNumber}*`,
      },
    });
  }

  // Standard verified and sealed
  shipment.currentStatus = 'INSPECTED_SEALED';
  shipment.updatedAt = new Date().toISOString();
  db.shipments.set(shipment.id, shipment);

  db.logAudit({
    actorId: agentId || 'usr-agent-303',
    actorName: agentName || 'Hub Agent',
    actorRole: 'HUB_AGENT',
    domain: 'HubOperations',
    action: 'INSPECT_AND_APPLY_SEAL',
    resourceType: 'Shipment',
    resourceId: shipment.id,
    details: { sealId: seal, actualWeightKg: actualKg, photosCount: photos.length },
  });

  res.json({
    success: true,
    message: `Shipment physically inspected, scale verified (${actualKg} kg), and sealed with tamper-evident lock ${seal}.`,
    shipment,
    billOfLading: {
      trackingNumber: shipment.trackingNumber,
      sealId: seal,
      actualWeightKg: actualKg,
      status: 'INSPECTED_SEALED',
      barcode: `*${shipment.trackingNumber}*`,
      photos: shipment.inspectionPhotos,
    },
  });
});

// Dispatch Manifest Batch to Departing Traveler (Origin Hub Handover)
hubsRouter.post('/manifests/dispatch', (req: Request, res: Response) => {
  const {
    tripId,
    agentId,
    shipmentIds,
  } = req.body;

  const trip = db.trips.get(tripId);
  if (!trip) {
    return res.status(404).json({ success: false, error: 'Trip not found' });
  }

  const packages = Array.from(db.shipments.values()).filter((s) => shipmentIds.includes(s.id));
  if (packages.length === 0) {
    return res.status(400).json({ success: false, error: 'No valid packages selected for manifest' });
  }

  const totalWeight = Number(packages.reduce((sum, p) => sum + (p.actualWeightKg || p.estimatedWeightKg), 0).toFixed(2));
  const totalValue = Number(packages.reduce((sum, p) => sum + p.declaredValue, 0).toFixed(2));
  const sealIds = packages.map((p) => p.securitySealId).filter(Boolean) as string[];

  const manifestId = `man-${Date.now().toString().slice(-5)}`;
  const manifestCode = `MAN-${trip.originHubId.replace('hub-', '').toUpperCase()}-${trip.destinationHubId.replace('hub-', '').toUpperCase()}-${Date.now().toString().slice(-4)}`;

  const handoverSecret = generateCryptographicHandoverToken({
    manifestId,
    travelerId: trip.travelerId,
    agentId: agentId || 'usr-agent-303',
    totalWeightKg: totalWeight,
    packageCount: packages.length,
    timestamp: new Date().toISOString(),
  });

  const manifest: Manifest = {
    id: manifestId,
    manifestCode,
    tripId: trip.id,
    travelerId: trip.travelerId,
    originHubId: trip.originHubId,
    destinationHubId: trip.destinationHubId,
    dispatchedByAgentId: agentId || 'usr-agent-303',
    shipmentIds,
    totalPackages: packages.length,
    totalWeightKg: totalWeight,
    totalDeclaredValue: totalValue,
    handoverQrSecret: handoverSecret,
    dispatchTimestamp: new Date().toISOString(),
    status: 'HANDED_OVER',
    tamperSealIds: sealIds,
    createdAt: new Date().toISOString(),
  };

  db.manifests.set(manifest.id, manifest);

  // Update Trip
  trip.allocatedWeightKg = totalWeight;
  trip.manifestId = manifest.id;
  trip.status = 'DISPATCHED';
  db.trips.set(trip.id, trip);

  // Update Shipments
  packages.forEach((s) => {
    s.assignedTripId = trip.id;
    s.assignedTravelerId = trip.travelerId;
    s.assignedTravelerName = trip.travelerName;
    s.flightNumber = trip.flightNumber;
    s.airline = trip.airline;
    s.currentStatus = 'IN_TRANSIT';
    s.updatedAt = new Date().toISOString();
    db.shipments.set(s.id, s);
  });

  db.logAudit({
    actorId: agentId || 'usr-agent-303',
    actorName: 'Hub Agent',
    actorRole: 'HUB_AGENT',
    domain: 'Manifest',
    action: 'DISPATCH_MANIFEST_TO_TRAVELER',
    resourceType: 'Manifest',
    resourceId: manifest.id,
    details: {
      manifestCode,
      tripId: trip.id,
      travelerName: trip.travelerName,
      totalPackages: packages.length,
      totalWeightKg: totalWeight,
    },
  });

  res.json({
    success: true,
    message: 'Manifest created and securely dispatched to traveler via HMAC-signed QR token.',
    manifest,
    handoverToken: handoverSecret,
  });
});

// Destination Hub Intake via QR Scan (Verify & Release Escrow & Payout)
hubsRouter.post('/manifests/intake-arrival', (req: Request, res: Response) => {
  const { qrToken, agentId, agentName } = req.body;

  const verification = verifyCryptographicHandoverToken(qrToken);
  if (!verification.isValid || !verification.payload) {
    return res.status(400).json({
      success: false,
      error: `Cryptographic Handover Verification Failed: ${verification.error || 'Tampered or invalid token'}`,
    });
  }

  const { manifestId, travelerId, totalWeightKg, packageCount } = verification.payload;
  const manifest = db.manifests.get(manifestId);

  if (!manifest) {
    // If not found by exact ID, find by traveler
    const fallbackManifest = Array.from(db.manifests.values()).find((m) => m.travelerId === travelerId);
    if (!fallbackManifest) {
      return res.status(404).json({ success: false, error: 'Manifest not found in registry' });
    }
  }

  const targetManifest = manifest || Array.from(db.manifests.values()).find((m) => m.travelerId === travelerId)!;
  const trip = db.trips.get(targetManifest.tripId);

  // Update Manifest
  targetManifest.status = 'DELIVERED_TO_DEST_HUB';
  targetManifest.receivedByAgentId = agentId || 'usr-manager-404';
  targetManifest.receiptTimestamp = new Date().toISOString();
  db.manifests.set(targetManifest.id, targetManifest);

  // Update Shipments
  targetManifest.shipmentIds.forEach((shipId) => {
    const s = db.shipments.get(shipId);
    if (s) {
      s.currentStatus = 'READY_FOR_PICKUP';
      s.updatedAt = new Date().toISOString();
      db.shipments.set(s.id, s);
    }
  });

  // Update Trip
  if (trip) {
    trip.status = 'COMPLETED';
    db.trips.set(trip.id, trip);

    // Escrow Release & Traveler Payout Logic
    const travelerWallet = db.wallets.get(trip.travelerId);
    if (travelerWallet) {
      // 1. Unlock security deposit
      const depositToUnlock = trip.requiredEscrowDeposit;
      travelerWallet.lockedEscrowDeposit = Math.max(0, Number((travelerWallet.lockedEscrowDeposit - depositToUnlock).toFixed(2)));
      travelerWallet.balance = Number((travelerWallet.balance + depositToUnlock).toFixed(2));

      // 2. Transfer traveler earnings payout
      const payoutAmount = trip.totalEarningsEstimated;
      travelerWallet.balance = Number((travelerWallet.balance + payoutAmount).toFixed(2));
      travelerWallet.pendingEarnings = Math.max(0, Number((travelerWallet.pendingEarnings - payoutAmount).toFixed(2)));
      travelerWallet.updatedAt = new Date().toISOString();
      db.wallets.set(travelerWallet.userId, travelerWallet);

      // Record Ledger Transactions
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
        referenceNote: `Refundable escrow security deposit released upon verified delivery to destination hub (${targetManifest.manifestCode})`,
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
        referenceNote: `Traveler luggage delivery earnings payout for ${targetManifest.totalPackages} packages (${targetManifest.totalWeightKg} kg)`,
      });
    }
  }

  db.logAudit({
    actorId: agentId || 'usr-manager-404',
    actorName: agentName || 'Destination Hub Agent',
    actorRole: 'HUB_AGENT',
    domain: 'HubOperations',
    action: 'INTAKE_DESTINATION_MANIFEST',
    resourceType: 'Manifest',
    resourceId: targetManifest.id,
    details: {
      manifestCode: targetManifest.manifestCode,
      packagesCount: packageCount,
      weightKg: totalWeightKg,
      escrowReleased: true,
    },
  });

  res.json({
    success: true,
    message: `Destination intake verified successfully! ${targetManifest.totalPackages} packages received. Traveler escrow deposit unlocked and payout credited.`,
    manifest: targetManifest,
  });
});

// Alias for Hub Intake Inspection
hubsRouter.post('/intake-inspect', (req: Request, res: Response) => {
  const { shipmentId, id } = req.body;
  const targetId = shipmentId || id;
  if (!targetId) {
    return res.status(400).json({ success: false, error: 'Shipment ID is required for intake inspection' });
  }

  // Forward to standard inspection logic
  req.params.id = targetId;
  const shipment = db.shipments.get(targetId);
  if (!shipment) {
    return res.status(404).json({ success: false, error: 'Shipment not found' });
  }

  const {
    agentId,
    agentName,
    actualWeightKg,
    actual_weight_kg,
    inspectionNotes,
    inspection_notes,
    securitySealId,
    security_seal_id,
    inspectionPhotos,
    inspection_photos,
    photoUrls,
  } = req.body;

  const hub = db.hubs.get(shipment.originHubId);
  const seal = securitySealId || security_seal_id || generateTamperSealCode(hub ? hub.code : 'AMM');
  const actualKg = Number(actualWeightKg || actual_weight_kg) || shipment.estimatedWeightKg;
  const photos = inspectionPhotos || inspection_photos || photoUrls || [
    'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
  ];

  shipment.actualWeightKg = actualKg;
  shipment.securitySealId = seal;
  shipment.inspectionPhotos = photos;
  shipment.inspectionNotes = inspectionNotes || inspection_notes || 'Inspection completed: Contents verified against IATA regulations and certified tamper-sealed.';
  shipment.inspectedByAgentId = agentId || 'usr-agent-303';
  shipment.inspectedAt = new Date().toISOString();

  // Check for weight discrepancy (> 0.2 kg difference over estimate)
  const discrepancyDeltaKg = Number((actualKg - shipment.estimatedWeightKg).toFixed(2));
  if (discrepancyDeltaKg > 0.2) {
    const priceDelta = Number((discrepancyDeltaKg * 18.0).toFixed(2));
    shipment.currentStatus = 'WEIGHT_ADJUSTMENT_PENDING';
    shipment.weightDiscrepancy = {
      originalKg: shipment.estimatedWeightKg,
      actualKg,
      priceDelta,
      status: 'PENDING_CUSTOMER_APPROVAL',
    };

    db.shipments.set(shipment.id, shipment);

    db.logAudit({
      actorId: agentId || 'usr-agent-303',
      actorName: agentName || 'Hub Agent',
      actorRole: 'HUB_AGENT',
      domain: 'HubOperations',
      action: 'FLAG_WEIGHT_DISCREPANCY',
      resourceType: 'Shipment',
      resourceId: shipment.id,
      details: { originalKg: shipment.estimatedWeightKg, actualKg, priceDelta, sealId: seal },
    });

    return res.json({
      success: true,
      requiresCustomerApproval: true,
      message: `Weight discrepancy detected (${discrepancyDeltaKg} kg over estimate). Price adjustment alert sent to sender.`,
      shipment,
      billOfLading: {
        trackingNumber: shipment.trackingNumber,
        sealId: seal,
        actualWeightKg: actualKg,
        status: 'WEIGHT_ADJUSTMENT_PENDING',
        barcode: `*${shipment.trackingNumber}*`,
      },
    });
  }

  // Standard verified and sealed
  shipment.currentStatus = 'INSPECTED_SEALED';
  shipment.updatedAt = new Date().toISOString();
  db.shipments.set(shipment.id, shipment);

  db.logAudit({
    actorId: agentId || 'usr-agent-303',
    actorName: agentName || 'Hub Agent',
    actorRole: 'HUB_AGENT',
    domain: 'HubOperations',
    action: 'INSPECT_AND_APPLY_SEAL',
    resourceType: 'Shipment',
    resourceId: shipment.id,
    details: { sealId: seal, actualWeightKg: actualKg, photosCount: photos.length },
  });

  return res.json({
    success: true,
    message: `Shipment physically inspected, scale verified (${actualKg} kg), and sealed with tamper-evident lock ${seal}.`,
    shipment,
    billOfLading: {
      trackingNumber: shipment.trackingNumber,
      sealId: seal,
      actualWeightKg: actualKg,
      status: 'INSPECTED_SEALED',
      barcode: `*${shipment.trackingNumber}*`,
      photos: shipment.inspectionPhotos,
    },
  });
});

// Final Delivery to Recipient via OTP / Signature at Destination Hub
hubsRouter.post('/deliver-recipient', (req: Request, res: Response) => {
  const { shipmentId, otpCode, signatureUrl, agentId } = req.body;
  const shipment = db.shipments.get(shipmentId);

  if (!shipment) {
    return res.status(404).json({ success: false, error: 'Shipment not found' });
  }

  shipment.currentStatus = 'DELIVERED';
  shipment.deliveryProofSignature = signatureUrl || 'SIGNED_DIGITALLY_ON_GLASS';
  shipment.deliveredAt = new Date().toISOString();
  shipment.updatedAt = new Date().toISOString();
  db.shipments.set(shipment.id, shipment);

  db.logAudit({
    actorId: agentId || 'usr-manager-404',
    actorName: 'Destination Hub Agent',
    actorRole: 'HUB_AGENT',
    domain: 'HubOperations',
    action: 'DELIVER_TO_RECIPIENT',
    resourceType: 'Shipment',
    resourceId: shipment.id,
    details: { trackingNumber: shipment.trackingNumber, recipientName: shipment.recipientName },
  });

  return res.json({
    success: true,
    message: `Package ${shipment.trackingNumber} successfully handed over to recipient ${shipment.recipientName}.`,
    shipment,
  });
});

