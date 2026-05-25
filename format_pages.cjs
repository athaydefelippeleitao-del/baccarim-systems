const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'ProjectRapReportView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const pageRegex = /<div className="pdf-page-break" style={{ \.\.\.pageStyle, padding: '15mm 20mm 30mm 20mm' }}>\s*<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}><SmallLogo \/><\/div>([\s\S]*?)<Footer pageNum={(\d+)} \/>\s*<\/div>/g;

content = content.replace(pageRegex, (match, innerContent, pageNum) => {
    // Process innerContent
    // 1. Change blue color #1a3a6b to black #000
    let newInner = innerContent.replace(/'#1a3a6b'/g, "'#000'");
    // 2. Remove textDecoration underline
    newInner = newInner.replace(/,\s*textDecoration:\s*'underline'/g, "");
    newInner = newInner.replace(/textDecoration:\s*'underline',\s*/g, "");
    newInner = newInner.replace(/textDecoration:\s*'underline'/g, "");

    return `<div className="pdf-page-break" style={{ ...pageStyle }}>
          <div style={{ position: 'absolute', top: '12mm', left: '12mm', right: '12mm', bottom: '12mm', border: '1px solid #000', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            
            {/* Top Right Logo */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', padding: '8mm 12mm 0 0' }}>
              <img src="/logo_baccarim.jpg" alt="Baccarim Logo" style={{ width: '22mm', height: 'auto', objectFit: 'contain' }} />
            </div>

            <div style={{ flex: 1, padding: '0 12mm', display: 'flex', flexDirection: 'column' }}>${newInner}            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginBottom: '8mm', marginTop: 'auto' }}>
              <div style={{ fontSize: '8pt', color: '#000', lineHeight: 1.4 }}>
                <span style={{ fontWeight: '700' }}>BACCARIM ENGENHARIA URBANA LTDA</span><br />
                Avenida Dom Pedro II, 33 - Sala 02. Centro / Ibiporã – PR<br />
                Contato: (43) 3268-0916 / alberto@baccarimengenharia.com.br
              </div>
            </div>

            {/* Page Number */}
            <div style={{ position: 'absolute', bottom: '8mm', right: '12mm', fontSize: '10pt', color: '#000' }}>
              ${pageNum}
            </div>

          </div>
        </div>`;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Pages formatted successfully.');
