const fs = require('fs');

const path = 'components/ClientsView.tsx';
let content = fs.readFileSync(path, 'utf8');

const modalStartTag = '{/* MODAL FICHA F08 */}';
const newClientModalTag = '{showNewClientModal && (';

let modalStartIdx = content.indexOf(modalStartTag);
let modalEndIdx = content.indexOf(newClientModalTag);

if (modalStartIdx === -1 || modalEndIdx === -1) {
  console.log('Could not find modal sections.');
  process.exit(1);
}

// Extract the modal block
let modalBlock = content.substring(modalStartIdx, modalEndIdx);

let newBlock = modalBlock
  .replace('{showProfileModal && (', '{showProfileModal === client && (')
  .replace(/<div className="fixed inset-0[^>]+>[\s\S]*?<div className="bg-baccarim-card[^>]+>/m, 
    '<div onClick={(e) => e.stopPropagation()} className="mt-8 border-t border-baccarim-border pt-8 animate-in slide-in-from-top-4 duration-500 flex flex-col gap-6 cursor-default">')
  // The scrollable body should not have flex-1 max-h if it's inline, let's remove those
  .replace(/className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10"/g, 'className="space-y-10"')
  .replace(/<div className="p-8 border-b border-baccarim-border flex justify-between items-center bg-baccarim-hover gap-4">/g, 
           '<div className="flex justify-between items-center gap-4">')
  .replace(/<button\s+onClick=\{\(\) => \{\s*setShowProfileModal\(null\);\s*setAiExtractError\(null\);\s*\}\}\s+className="w-10 h-10[^>]+>[\s\S]*?<\/button>/g, '') // remove X close button in header
  // Footer: 
  .replace(/<div className="p-6 border-t border-baccarim-border bg-baccarim-hover flex justify-end gap-4">/g,
           '<div className="flex justify-end gap-4 mt-6">')
  // We need to remove the two closing `</div>` tags at the end of the block that closed the fixed inset and modal card.
  // We'll find the last two `</div>\n        </div>` before `)}`
let parts = newBlock.split(')}');
let body = parts.slice(0, -1).join(')}');
// remove the last two </div>
body = body.trim().replace(/<\/div>\s*<\/div>$/, '</div>');
newBlock = body + '\n              )}\n';

// Now, remove the old modal from the content
content = content.substring(0, modalStartIdx) + content.substring(modalEndIdx);

// Inject before the last two `</div>` in the client card
const injectionPoint = `                  </div>
                </div>
              </div>`;

content = content.replace(injectionPoint, injectionPoint + '\n\n              {/* INLINE F08 FORM */}\n              ' + newBlock);

fs.writeFileSync(path, content);
console.log('Refactored successfully.');
