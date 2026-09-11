/* ================================================================
   NOTE: The `translations` object is loaded from the external file:
   https://raw.githubusercontent.com/skylersage/Language/main/translation.js
   It must define:  var translations = { en: {...}, hi: {...}, ne: {...} }
   ================================================================ */

/* Fallback if external translations fail to load */
if (typeof translations === 'undefined') {
  var translations = { en: {}, hi: {}, ne: {} };
  console.warn('translation.js failed to load — using empty fallback.');
}

let currentLang = 'en';
let currentMode = 'forward';
let lastResult = null;

function t(key) {
  return (translations[currentLang] && translations[currentLang][key])
    || (translations.en && translations.en[key])
    || key;
}

function setLanguage(lang) {
  currentLang = lang;

  // Update <html lang="..."> for SEO and accessibility
  document.documentElement.lang = (lang === 'en') ? 'en' : (lang === 'hi' ? 'hi' : 'ne');

  ['en', 'hi', 'ne'].forEach(l => {
    document.getElementById('lang-' + l).classList.toggle('active-lang', l === lang);
  });

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });

  document.getElementById('title-text').textContent = t('title');

  // Update PDF template labels
  document.getElementById('pdf-title').textContent = t('title');
  document.getElementById('pdf-summary-title').textContent = t('summaryHeading');
  document.getElementById('pdf-label-principal').textContent = t('principalLabel') + ':';
  document.getElementById('pdf-label-rate').textContent = t('rateLabel') + ':';
  document.getElementById('pdf-label-time').textContent = t('timeLabel') + ':';
  document.getElementById('pdf-label-interest').textContent = t('totalInterest') + ':';
  document.getElementById('pdf-label-total').textContent = t('totalAmount') + ':';
  document.getElementById('pdf-footer').textContent = t('title') + ' – Traditional method';

  // Re-render result if any
  if (lastResult && !document.getElementById('output').querySelector('.error-box')) {
    renderResult(lastResult);
  }
}

function setMode(mode) {
  currentMode = mode;
  document.getElementById('mode-forward').classList.toggle('active-mode', mode === 'forward');
  document.getElementById('mode-reverse').classList.toggle('active-mode', mode === 'reverse');
  document.getElementById('forward-section').classList.toggle('active-section', mode === 'forward');
  document.getElementById('reverse-section').classList.toggle('active-section', mode === 'reverse');
  document.getElementById('output').innerHTML = '';
  lastResult = null;
  clearFieldErrors();
}

function updateReverseFields() {
  const solveFor = document.getElementById('revSolveFor').value;
  document.getElementById('rev-principal-fields').classList.toggle('hidden', solveFor !== 'principal');
  document.getElementById('rev-rate-fields').classList.toggle('hidden', solveFor !== 'rate');
  document.getElementById('rev-time-fields').classList.toggle('hidden', solveFor !== 'time');
  document.getElementById('output').innerHTML = '';
  lastResult = null;
  clearFieldErrors();
}

function clearFieldErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));
}

function showErrors(errors) {
  let html = '<div class="error-box"><strong>' + t('errFixFollowing') + '</strong><ul class="error-list">';
  errors.forEach(err => { html += `<li>${err}</li>`; });
  html += '</ul></div>';
  document.getElementById('output').innerHTML = html;
}

/* ============================
   FORWARD CALCULATION
   ============================ */
function calculateForward() {
  const principalEl = document.getElementById('principal');
  const rateEl = document.getElementById('rate');
  const timeEl = document.getElementById('time');
  const timeUnitEl = document.getElementById('timeUnit');

  const principalRaw = principalEl.value.trim();
  const rateRaw = rateEl.value.trim();
  const timeRaw = timeEl.value.trim();
  const timeUnit = timeUnitEl.value;

  const principal = parseFloat(principalRaw);
  const rate = parseFloat(rateRaw);
  const time = parseFloat(timeRaw);

  const errors = [];

  if (principalRaw === '') {
    errors.push(t('errPrincipalRequired'));
    principalEl.classList.add('field-error');
  } else if (isNaN(principal) || principal <= 0) {
    errors.push(t('errPrincipalPositive'));
    principalEl.classList.add('field-error');
  }

  if (rateRaw === '') {
    errors.push(t('errRateRequired'));
    rateEl.classList.add('field-error');
  } else if (isNaN(rate) || rate <= 0) {
    errors.push(t('errRatePositive'));
    rateEl.classList.add('field-error');
  }

  if (timeRaw === '') {
    errors.push(t('errTimeRequired'));
    timeEl.classList.add('field-error');
  } else if (isNaN(time) || time <= 0) {
    errors.push(t('errTimePositive'));
    timeEl.classList.add('field-error');
  }

  if (!timeUnit) {
    errors.push(t('errTimeUnit'));
    timeUnitEl.classList.add('field-error');
  }

  if (errors.length > 0) {
    showErrors(errors);
    lastResult = null;
    return;
  }

  const totalMonths = (timeUnit === "years") ? time * 12 : time;
  const interest = (principal / 100) * rate * totalMonths;
  const totalAmount = principal + interest;

  lastResult = {
    mode: 'forward',
    principal: principal,
    rate: rate,
    time: time,
    timeUnit: timeUnit,
    interest: interest,
    totalAmount: totalAmount
  };

  renderResult(lastResult);
}

/* ============================
   REVERSE CALCULATION
   ============================ */
function calculateReverse() {
  const solveFor = document.getElementById('revSolveFor').value;
  const errors = [];

  if (solveFor === 'principal') {
    const interestEl = document.getElementById('revInterest');
    const rateEl = document.getElementById('revRate');
    const timeEl = document.getElementById('revTime');
    const timeUnitEl = document.getElementById('revTimeUnit');

    const interestRaw = interestEl.value.trim();
    const rateRaw = rateEl.value.trim();
    const timeRaw = timeEl.value.trim();
    const timeUnit = timeUnitEl.value;

    const interest = parseFloat(interestRaw);
    const rate = parseFloat(rateRaw);
    const time = parseFloat(timeRaw);

    if (interestRaw === '') { errors.push(t('errInterestRequired')); interestEl.classList.add('field-error'); }
    else if (isNaN(interest) || interest <= 0) { errors.push(t('errInterestPositive')); interestEl.classList.add('field-error'); }

    if (rateRaw === '') { errors.push(t('errRateRequired')); rateEl.classList.add('field-error'); }
    else if (isNaN(rate) || rate <= 0) { errors.push(t('errRatePositive')); rateEl.classList.add('field-error'); }

    if (timeRaw === '') { errors.push(t('errTimeRequired')); timeEl.classList.add('field-error'); }
    else if (isNaN(time) || time <= 0) { errors.push(t('errTimePositive')); timeEl.classList.add('field-error'); }

    if (!timeUnit) { errors.push(t('errTimeUnit')); timeUnitEl.classList.add('field-error'); }

    if (errors.length > 0) { showErrors(errors); lastResult = null; return; }

    const totalMonths = (timeUnit === 'years') ? time * 12 : time;
    const principal = (interest * 100) / (rate * totalMonths);

    lastResult = {
      mode: 'reverse',
      solveFor: 'principal',
      principal: principal,
      rate: rate,
      time: time,
      timeUnit: timeUnit,
      interest: interest,
      totalAmount: principal + interest
    };

  } else if (solveFor === 'rate') {
    const principalEl = document.getElementById('revPrincipalRate');
    const interestEl = document.getElementById('revInterestRate');
    const timeEl = document.getElementById('revTimeRate');
    const timeUnitEl = document.getElementById('revTimeUnitRate');

    const principalRaw = principalEl.value.trim();
    const interestRaw = interestEl.value.trim();
    const timeRaw = timeEl.value.trim();
    const timeUnit = timeUnitEl.value;

    const principal = parseFloat(principalRaw);
    const interest = parseFloat(interestRaw);
    const time = parseFloat(timeRaw);

    if (principalRaw === '') { errors.push(t('errPrincipalRequired')); principalEl.classList.add('field-error'); }
    else if (isNaN(principal) || principal <= 0) { errors.push(t('errPrincipalPositive')); principalEl.classList.add('field-error'); }

    if (interestRaw === '') { errors.push(t('errInterestRequired')); interestEl.classList.add('field-error'); }
    else if (isNaN(interest) || interest <= 0) { errors.push(t('errInterestPositive')); interestEl.classList.add('field-error'); }

    if (timeRaw === '') { errors.push(t('errTimeRequired')); timeEl.classList.add('field-error'); }
    else if (isNaN(time) || time <= 0) { errors.push(t('errTimePositive')); timeEl.classList.add('field-error'); }

    if (!timeUnit) { errors.push(t('errTimeUnit')); timeUnitEl.classList.add('field-error'); }

    if (errors.length > 0) { showErrors(errors); lastResult = null; return; }

    const totalMonths = (timeUnit === 'years') ? time * 12 : time;
    const rate = (interest * 100) / (principal * totalMonths);

    lastResult = {
      mode: 'reverse',
      solveFor: 'rate',
      principal: principal,
      rate: rate,
      time: time,
      timeUnit: timeUnit,
      interest: interest,
      totalAmount: principal + interest
    };

  } else if (solveFor === 'time') {
    const principalEl = document.getElementById('revPrincipalTime');
    const rateEl = document.getElementById('revRateTime');
    const interestEl = document.getElementById('revInterestTime');
    const outUnitEl = document.getElementById('revTimeUnitTime');

    const principalRaw = principalEl.value.trim();
    const rateRaw = rateEl.value.trim();
    const interestRaw = interestEl.value.trim();
    const outputUnit = outUnitEl.value;

    const principal = parseFloat(principalRaw);
    const rate = parseFloat(rateRaw);
    const interest = parseFloat(interestRaw);

    if (principalRaw === '') { errors.push(t('errPrincipalRequired')); principalEl.classList.add('field-error'); }
    else if (isNaN(principal) || principal <= 0) { errors.push(t('errPrincipalPositive')); principalEl.classList.add('field-error'); }

    if (rateRaw === '') { errors.push(t('errRateRequired')); rateEl.classList.add('field-error'); }
    else if (isNaN(rate) || rate <= 0) { errors.push(t('errRatePositive')); rateEl.classList.add('field-error'); }

    if (interestRaw === '') { errors.push(t('errInterestRequired')); interestEl.classList.add('field-error'); }
    else if (isNaN(interest) || interest <= 0) { errors.push(t('errInterestPositive')); interestEl.classList.add('field-error'); }

    if (errors.length > 0) { showErrors(errors); lastResult = null; return; }

    const totalMonths = (interest * 100) / (principal * rate);
    const time = (outputUnit === 'years') ? totalMonths / 12 : totalMonths;

    lastResult = {
      mode: 'reverse',
      solveFor: 'time',
      principal: principal,
      rate: rate,
      time: time,
      timeUnit: outputUnit,
      interest: interest,
      totalAmount: principal + interest,
      timeInMonths: totalMonths
    };
  }

  renderResult(lastResult);
}

function calculateInterest() {
  clearFieldErrors();
  if (currentMode === 'forward') {
    calculateForward();
  } else {
    calculateReverse();
  }
}

/* ============================
   RENDER RESULT
   ============================ */
function renderResult(result) {
  if (!result) return;
  let html = '<div class="summary-heading">' + t('summaryHeading') + '</div>';

  if (result.mode === 'forward') {
    html += `<strong>${t('totalInterest')}:</strong> Rs ${result.interest.toFixed(2)}<br>
             <strong>${t('totalAmount')}:</strong> Rs ${result.totalAmount.toFixed(2)}`;
  } else {
    if (result.solveFor === 'principal') {
      html += `<strong>${t('revResultPrincipal')}:</strong> Rs ${result.principal.toFixed(2)}<br>`;
      html += `<strong>${t('revGivenInterest')}:</strong> Rs ${result.interest.toFixed(2)}<br>`;
      html += `<strong>${t('revGivenRate')}:</strong> Rs ${result.rate} / 100 / ${t('months').toLowerCase()}<br>`;
      html += `<strong>${t('revGivenTime')}:</strong> ${result.time} ${result.timeUnit === 'years' ? t('years') : t('months')}`;
    } else if (result.solveFor === 'rate') {
      html += `<strong>${t('revResultRate')}:</strong> Rs ${result.rate.toFixed(4)}<br>`;
      html += `<strong>${t('revGivenPrincipal')}:</strong> Rs ${result.principal.toFixed(2)}<br>`;
      html += `<strong>${t('revGivenInterest')}:</strong> Rs ${result.interest.toFixed(2)}<br>`;
      html += `<strong>${t('revGivenTime')}:</strong> ${result.time} ${result.timeUnit === 'years' ? t('years') : t('months')}`;
    } else if (result.solveFor === 'time') {
      const monthsDisplay = result.timeInMonths.toFixed(2);
      const yearsDisplay = (result.timeInMonths / 12).toFixed(2);
      html += `<strong>${t('revResultTimeMonths')}:</strong> ${monthsDisplay} ${t('months')}<br>`;
      html += `<strong>${t('revResultTimeYears')}:</strong> ${yearsDisplay} ${t('years')}<br>`;
      html += `<strong>${t('revGivenPrincipal')}:</strong> Rs ${result.principal.toFixed(2)}<br>`;
      html += `<strong>${t('revGivenRate')}:</strong> Rs ${result.rate} / 100 / ${t('months').toLowerCase()}<br>`;
      html += `<strong>${t('revGivenInterest')}:</strong> Rs ${result.interest.toFixed(2)}`;
    }
  }

  html += `
    <button class="download-btn" onclick="downloadPDF()">${t('downloadBtn')}</button>
    <button class="whatsapp-btn" onclick="shareWhatsApp()">${t('whatsappBtn')}</button>
  `;

  document.getElementById('output').innerHTML = html;
}

function clearFields() {
  document.getElementById('principal').value = '';
  document.getElementById('rate').value = '';
  document.getElementById('time').value = '';
  document.getElementById('timeUnit').selectedIndex = 0;

  document.getElementById('revInterest').value = '';
  document.getElementById('revRate').value = '';
  document.getElementById('revTime').value = '';
  document.getElementById('revTimeUnit').selectedIndex = 0;

  document.getElementById('revPrincipalRate').value = '';
  document.getElementById('revInterestRate').value = '';
  document.getElementById('revTimeRate').value = '';
  document.getElementById('revTimeUnitRate').selectedIndex = 0;

  document.getElementById('revPrincipalTime').value = '';
  document.getElementById('revRateTime').value = '';
  document.getElementById('revInterestTime').value = '';
  document.getElementById('revTimeUnitTime').selectedIndex = 0;

  document.getElementById('output').innerHTML = '';
  lastResult = null;
  clearFieldErrors();
}

/* ============================
   PDF GENERATION (shared helper)
   ============================ */
function generatePDFBlob() {
  return new Promise((resolve, reject) => {
    if (!lastResult) {
      reject(new Error('No result available'));
      return;
    }

    document.getElementById('pdf-principal').innerText = lastResult.principal.toFixed(2);
    document.getElementById('pdf-rate').innerText = lastResult.rate;
    document.getElementById('pdf-time').innerText = lastResult.time;
    document.getElementById('pdf-unit').innerText = lastResult.timeUnit === 'years' ? t('years') : t('months');
    document.getElementById('pdf-interest').innerText = lastResult.interest.toFixed(2);
    document.getElementById('pdf-total').innerText = lastResult.totalAmount.toFixed(2);

    const template = document.getElementById('pdf-template');
    template.style.left = '-9999px';
    template.style.display = 'block';

    html2canvas(template, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false
    }).then(canvas => {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 40;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const imgData = canvas.toDataURL('image/png');

      if (imgHeight <= pageHeight - margin * 2) {
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      } else {
        let remainingHeight = imgHeight;
        let position = 0;
        const pageContentHeight = pageHeight - margin * 2;

        while (remainingHeight > 0) {
          const sliceHeight = Math.min(pageContentHeight, remainingHeight);
          const sliceCanvasHeight = (sliceHeight / imgHeight) * canvas.height;
          const sliceCanvasY = (position / imgHeight) * canvas.height;

          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceCanvasHeight;
          const ctx = sliceCanvas.getContext('2d');
          ctx.drawImage(
            canvas,
            0, sliceCanvasY, canvas.width, sliceCanvasHeight,
            0, 0, canvas.width, sliceCanvasHeight
          );

          const sliceData = sliceCanvas.toDataURL('image/png');
          const sliceImgHeight = (sliceCanvasHeight * imgWidth) / canvas.width;

          pdf.addImage(sliceData, 'PNG', margin, margin, imgWidth, sliceImgHeight);

          remainingHeight -= sliceHeight;
          position += sliceHeight;

          if (remainingHeight > 0) {
            pdf.addPage();
          }
        }
      }

      template.style.display = 'none';
      const blob = pdf.output('blob');
      resolve(blob);
    }).catch(err => {
      template.style.display = 'none';
      reject(err);
    });
  });
}

/* ============================
   PDF DOWNLOAD
   ============================ */
function downloadPDF() {
  const outputDiv = document.getElementById('output');
  if (!outputDiv || outputDiv.innerHTML.trim() === '' || outputDiv.querySelector('.error-box')) {
    outputDiv.innerHTML = '<div class="error-box">' + t('errCalcValidFirst') + '</div>';
    return;
  }

  if (!lastResult) return;

  generatePDFBlob().then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Village-Interest-Result.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }).catch(err => {
    console.error('PDF generation error:', err);
    outputDiv.innerHTML = '<div class="error-box">' + t('errCouldNotGenerate') + '</div>';
  });
}

/* ============================
   WHATSAPP SHARE (shares PDF file)
   ============================ */
function shareWhatsApp() {
  if (!lastResult) {
    document.getElementById('output').innerHTML = '<div class="error-box">' + t('errCalcValidFirst') + '</div>';
    return;
  }

  const outputDiv = document.getElementById('output');
  const originalHTML = outputDiv.innerHTML;

  const tempNotice = document.createElement('div');
  tempNotice.className = 'share-notice';
  tempNotice.textContent = t('whatsappPreparing');
  outputDiv.appendChild(tempNotice);

  generatePDFBlob().then(blob => {
    const fileName = 'Village-Interest-Result.pdf';
    const file = new File([blob], fileName, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({
        files: [file],
        title: t('title'),
        text: t('whatsappHeader').replace(/\*/g, '')
      }).then(() => {
        tempNotice.textContent = t('whatsappReady');
        setTimeout(() => { if (tempNotice.parentNode) tempNotice.remove(); }, 2500);
      }).catch(err => {
        console.warn('Share cancelled or failed:', err);
     fallbackWhatsAppShare(blob, fileName, tempNotice);
      });
    } else {
      fallbackWhatsAppShare(blob, fileName, tempNotice);
    }
  }).catch(err => {
    console.error('PDF generation error:', err);
    if (tempNotice.parentNode) tempNotice.remove();
    outputDiv.innerHTML = '<div class="error-box">' + t('errWhatsappPdfFail') + '</div>';
    setTimeout(() => { outputDiv.innerHTML = originalHTML; }, 3000);
  });
}

function fallbackWhatsAppShare(blob, fileName, tempNotice) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  const message = t('whatsappHeader') + '\n\n' +
    '📎 ' + fileName + '\n' +
    (currentLang === 'hi' ? '(डाउनलोड की गई PDF फ़ाइल संलग्न करें)' :
     currentLang === 'ne' ? '(डाउनलोड गरिएको PDF फाइल संलग्न गर्नुहोस्)' :
     '(Please attach the downloaded PDF file)');

  const whatsappUrl = 'https://wa.me/?text=' + encodeURIComponent(message);

  setTimeout(() => {
    window.open(whatsappUrl, '_blank');
    if (tempNotice) tempNotice.remove();
  }, 800);
}

/* Initialize */
document.addEventListener('DOMContentLoaded', function() {
  setLanguage('en');
});

