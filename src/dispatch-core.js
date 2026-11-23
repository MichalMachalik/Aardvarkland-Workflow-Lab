export function verifyDispatch(data, shipmentId, documentId) {
  const shipment = data.shipments.find(item => item.id === shipmentId);
  if (!shipment) throw new Error('Zásilka nebyla nalezena.');
  const document = data.documents.find(item => item.id === documentId);
  const unverified = { shipmentId, status: null, evidence: null };
  if (!document) return { ...unverified, code: 'missing' };
  if (document.shipmentId !== shipmentId) return { ...unverified, code: 'unrelated' };
  if (document.kind !== shipment.requiredKind) return { ...unverified, code: 'insufficient', evidence: document };
  return { code: 'verified', shipmentId, status: shipment.status, evidence: document };
}
