function generateQR(url) {
  const container = $('qr-container');
  if (!container) return;

  // Charge qrcode.js depuis CDN si pas déjà présent
  if (typeof QRCode === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.onload = () => renderQR(url, container);
    document.head.appendChild(script);
  } else {
    renderQR(url, container);
  }

  function renderQR(text, target) {
    target.innerHTML = '';
    new QRCode(target, {
      text: text,
      width: 160,
      height: 160,
      colorDark: '#1a1917',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
    
    // Style du QR sur la page admin
    setTimeout(() => {
      const img = target.querySelector('img') || target.querySelector('canvas');
      if (img) {
        img.style.borderRadius = '12px';
        img.style.border = '4px solid var(--border)';
      }
    }, 100);
  }
}

function printQR() {
  const registerUrl = `${window.location.origin}${window.location.pathname}?register=1`;
  const logoUrl = `${window.location.origin}/icon-512.png`;
  
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Affiche CoproSync — Résidence le Floréal</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A4; margin: 0; }

  body {
    font-family: 'Instrument Sans', sans-serif;
    background: #0c0b09;
    width: 210mm; min-height: 297mm;
  }

  .page {
    width: 210mm; min-height: 297mm;
    background: #0c0b09;
    display: flex; flex-direction: column;
    position: relative; overflow: hidden;
  }

  .bg-gradient {
    position: absolute; inset: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 80% 50% at 50% 0%, rgba(37,99,235,.12) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 0% 100%, rgba(124,58,237,.08) 0%, transparent 50%),
      radial-gradient(ellipse 50% 50% at 100% 50%, rgba(16,185,129,.06) 0%, transparent 50%);
  }
  .bg-grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
    background-size: 12mm 12mm;
  }

  .content {
    position: relative; z-index: 1;
    display: flex; flex-direction: column; align-items: center;
    padding: 16mm 14mm 12mm;
    flex: 1;
  }

  .top-badge {
    display: flex; align-items: center; gap: 6px;
    background: rgba(37,99,235,.15); border: 1px solid rgba(37,99,235,.3);
    border-radius: 20px; padding: 4px 14px;
    font-size: 9pt; font-weight: 600; color: rgba(99,149,255,.9);
    letter-spacing: .08em; text-transform: uppercase;
    margin-bottom: 8mm;
  }
  .top-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #3b82f6; }

  .app-logo {
    width: 64px; height: 64px;
    object-fit: contain;
    margin-bottom: 4mm;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
  }

  .hero { text-align: center; margin-bottom: 10mm; }
  .hero-eyebrow {
    font-size: 9pt; font-weight: 600; color: rgba(255,255,255,.35);
    text-transform: uppercase; letter-spacing: .15em; margin-bottom: 4mm;
  }
  .hero-title {
    font-family: 'Syne', sans-serif;
    font-size: 42pt; font-weight: 800;
    color: #fff; letter-spacing: -2px; line-height: 1;
    margin-bottom: 4mm;
  }
  .hero-title em {
    font-style: normal; color: transparent;
    background: linear-gradient(135deg, #3b82f6, #818cf8);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .hero-sub {
    font-size: 12pt; color: rgba(255,255,255,.45);
    line-height: 1.5; max-width: 120mm; margin: 0 auto;
  }

  .divider { width: 100%; display: flex; align-items: center; gap: 4mm; margin: 8mm 0; }
  .divider-line { flex: 1; height: 1px; background: rgba(255,255,255,.08); }
  .divider-txt { font-size: 8pt; color: rgba(255,255,255,.25); letter-spacing: .1em; text-transform: uppercase; }

  .qr-frame {
    background: #fff;
    border-radius: 12mm; padding: 10mm 8mm 8mm;
    box-shadow: 0 8mm 24mm rgba(0,0,0,.6);
    display: flex; flex-direction: column; align-items: center;
    margin-bottom: 8mm; position: relative;
  }
  .qr-frame::before {
    content: ''; position: absolute; inset: -2mm; border-radius: 14mm;
    background: linear-gradient(135deg, rgba(59,130,246,.3), rgba(129,140,248,.2), rgba(16,185,129,.15));
    z-index: -1;
  }
  
  .qr-label {
    font-size: 9pt; font-weight: 800; 
    color: #c59b27;
    text-transform: uppercase; letter-spacing: .12em;
    margin-bottom: 6mm; text-align: center;
    text-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  
  #qr-print { display: flex; justify-content: center; margin-bottom: 2mm; }

  .steps { display: grid; grid-template-columns: repeat(3,1fr); gap: 4mm; width: 100%; margin-bottom: 8mm; }
  .step { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.07); border-radius: 5mm; padding: 5mm 4mm; text-align: center; }
  .step-num { width: 8mm; height: 8mm; border-radius: 50%; background: #2563eb; color: #fff; font-weight: 800; display: flex; align-items: center; justify-content: center; margin: 0 auto 3mm; }
  .step-title { font-family: 'Syne', sans-serif; font-size: 9.5pt; font-weight: 700; color: #fff; margin-bottom: 2mm; }
  .step-desc { font-size: 8pt; color: rgba(255,255,255,.35); line-height: 1.5; }

  .footer { border-top: 1px solid rgba(255,255,255,.07); padding-top: 5mm; width: 100%; display: flex; align-items: center; justify-content: space-between; }
  .footer-brand { font-family: 'Syne', sans-serif; font-size: 13pt; font-weight: 800; color: #fff; }
  .footer-addr { font-size: 8pt; color: rgba(255,255,255,.3); }

  @media print { button { display: none !important; } }
</style>
</head>
<body>
<div class="page">
  <div class="bg-gradient"></div><div class="bg-grid"></div>
  <div class="content">
    <div class="top-badge"><div class="top-badge-dot"></div>Résidence le Floréal · Sassenage</div>
    
    <img src="${logoUrl}" alt="Logo" class="app-logo" onerror="this.style.display='none'">

    <div class="hero">
      <div class="hero-eyebrow">Votre résidence numérique</div>
      <div class="hero-title">Rejoignez<br><em>CoproSync</em></div>
      <div class="hero-sub">Signalez, échangez, votez — tout depuis votre téléphone.</div>
    </div>

    <div class="divider"><div class="divider-line"></div><div class="divider-txt">Scannez pour commencer</div><div class="divider-line"></div></div>

    <div class="qr-frame">
      <div class="qr-label">Scannez pour créer votre compte</div>
      <div id="qr-print"></div>
    </div>

    <div class="steps">
      <div class="step"><div class="step-num">1</div><div class="step-title">Scannez</div><div class="step-desc">Pointez votre appareil photo sur le QR code</div></div>
      <div class="step"><div class="step-num">2</div><div class="step-title">Remplissez</div><div class="step-desc">Prénom, tour et numéro de lot</div></div>
      <div class="step"><div class="step-num">3</div><div class="step-title">Accédez</div><div class="step-desc">Confirmez votre email et c'est parti</div></div>
    </div>

    <div class="footer">
      <div><div class="footer-brand">CoproSync</div><div class="footer-addr">13-19 Rue du Moucherotte, 38360 Sassenage</div></div>
      <div style="text-align:right; font-size:8pt;color:rgba(255,255,255,.25);">Gratuit · Sécurisé · Collaboratif</div>
    </div>
  </div>
</div>
<script>
  window.onload = () => {
    new QRCode(document.getElementById('qr-print'), {
      text: '${registerUrl}',
      width: 180, height: 180,
      colorDark: '#0c0b09', colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
    setTimeout(() => window.print(), 1500);
  };
<\/script>
</body></html>`);
  win.document.close();
}
