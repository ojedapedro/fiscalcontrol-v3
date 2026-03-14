/**
 * Google Apps Script for FiscalControl Pro
 * Deploy this as a Web App with access set to "Anyone".
 */

// Define Column Indices (0-based) for easier maintenance
const COL = {
  ID: 0,
  DATE_REG: 1,
  ORGANISM: 2,
  TYPE: 3,
  AMOUNT: 4,
  DATE_REAL: 5,
  UNIT_CODE: 6,
  UNIT_NAME: 7,
  MUNICIPALITY: 8,
  STATUS: 9,
  DESCRIPTION: 10,
  PHONE: 11,
  TIMESTAMP: 12
};

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const request = JSON.parse(e.postData.contents);
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = 'RegistroPagos';
    let sheet = doc.getSheetByName(sheetName);

    // --- ACTION: CREATE (Register Payment) ---
    if (!request.action || request.action === 'create') {
      if (!sheet) {
        sheet = doc.insertSheet(sheetName);
        sheet.appendRow([
          'ID', 'Fecha Registro', 'Organismo', 'Tipo Pago', 'Monto', 
          'Fecha Pago Real', 'Código Unidad', 'Nombre Unidad', 'Municipio', 
          'Estado', 'Descripción', 'Teléfono', 'Timestamp'
        ]);
        sheet.getRange(1, 1, 1, 13).setFontWeight('bold').setBackground('#1e3a8a').setFontColor('#ffffff');
      }

      sheet.appendRow([
        request.data.id,
        request.data.dateRegistered,
        request.data.organism,
        request.data.paymentType,
        request.data.amount,
        request.data.paymentDateReal,
        request.data.unitCode,
        request.data.unitName,
        request.data.municipality,
        request.data.status || 'Pending Review',
        request.data.description || '',
        request.data.contactPhone || '',
        new Date()
      ]);

      return createJSONOutput({ 'result': 'success', 'row': sheet.getLastRow() });
    }

    // --- ACTION: READ (Get History) ---
    if (request.action === 'read') {
      if (!sheet) {
        return createJSONOutput({ 'result': 'success', 'data': [] });
      }

      const rows = sheet.getDataRange().getValues();
      const data = rows.slice(1).map(row => {
        return {
          id: row[COL.ID],
          dateRegistered: row[COL.DATE_REG], 
          organism: row[COL.ORGANISM],
          paymentType: row[COL.TYPE],
          amount: Number(row[COL.AMOUNT]),
          paymentDateReal: row[COL.DATE_REAL],
          unitCode: row[COL.UNIT_CODE],
          unitName: row[COL.UNIT_NAME],
          municipality: row[COL.MUNICIPALITY],
          status: row[COL.STATUS],
          description: row[COL.DESCRIPTION],
          contactPhone: row[COL.PHONE]
        };
      });

      return createJSONOutput({ 'result': 'success', 'data': data });
    }

    // --- ACTION: UPDATE (Approve/Reject) ---
    if (request.action === 'update') {
      if (!sheet) return createJSONOutput({ 'result': 'error', 'message': 'Sheet not found' });
      
      const rows = sheet.getDataRange().getValues();
      const idToUpdate = request.data.id;
      const newStatus = request.data.status;
      
      let found = false;
      // Loop through rows (skip header)
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][COL.ID] === idToUpdate) {
          // Update Status Column (Row is i+1 because sheet is 1-based)
          sheet.getRange(i + 1, COL.STATUS + 1).setValue(newStatus);
          found = true;
          break;
        }
      }

      if (found) {
        return createJSONOutput({ 'result': 'success', 'message': 'Updated' });
      } else {
        return createJSONOutput({ 'result': 'error', 'message': 'ID not found' });
      }
    }
    
    // --- ACTION: TRIGGER SETUP ---
    if (request.action === 'setupTrigger') {
      setupTrigger();
      return createJSONOutput({ 'result': 'success', 'message': 'Daily trigger setup complete' });
    }

    return createJSONOutput({ 'result': 'error', 'message': 'Invalid action' });

  } catch (e) {
    return createJSONOutput({ 'result': 'error', 'error': e.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * UTILITY: Run this function MANUALLY once from the Apps Script Editor
 */
function setupTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'checkUpcomingPayments') {
      return; 
    }
  }
  ScriptApp.newTrigger('checkUpcomingPayments').timeBased().everyDays(1).atHour(8).create();
}

/**
 * AUTOMATIC TASK: Checks for payments due in 3 days.
 */
function checkUpcomingPayments() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = doc.getSheetByName('RegistroPagos');
  if (!sheet) return;

  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const status = row[COL.STATUS];
    const paymentDateString = row[COL.DATE_REAL];
    const phone = row[COL.PHONE];
    const organism = row[COL.ORGANISM];
    const amount = row[COL.AMOUNT];

    // Only notify for Pending Review or Approved (but unpaid) if you track paid status separately.
    // Assuming 'Pending Review' needs checking.
    if ((status === 'Pending Review' || status === 'Approved') && phone) {
      const paymentDate = new Date(paymentDateString);
      paymentDate.setHours(0, 0, 0, 0);
      const diffTime = paymentDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 3) {
        const message = `🔔 *Recordatorio de Pago* 🔔\n\nEl pago para *${organism}* ($${amount}) vence en 3 días.\nEstado: ${status}`;
        sendWhatsAppNotification(phone, message);
      }
    }
  }
}

function sendWhatsAppNotification(phone, message) {
  console.log(`[SIMULATION] Sending WhatsApp to ${phone}: ${message}`);
}

function createJSONOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return createJSONOutput({ 'status': 'alive', 'message': 'Use POST to interact with data' });
}