/**
 * Simple Markdown to HTML converter
 * Converts basic Markdown syntax to HTML
 */
export const markdownToHtml = (markdown) => {
  if (!markdown) return '';

  // Split into lines for processing
  const lines = markdown.split('\n');
  const processedLines = [];
  let inList = false;
  let listType = null; // 'ul' or 'ol'
  let listItems = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for headers
    if (trimmed.startsWith('### ')) {
      if (inList) {
        // Close current list
        processedLines.push(`<${listType}>${listItems.join('')}</${listType}>`);
        listItems = [];
        inList = false;
        listType = null;
      }
      processedLines.push(`<h3>${processInlineFormatting(trimmed.substring(4))}</h3>`);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      if (inList) {
        processedLines.push(`<${listType}>${listItems.join('')}</${listType}>`);
        listItems = [];
        inList = false;
        listType = null;
      }
      processedLines.push(`<h2>${processInlineFormatting(trimmed.substring(3))}</h2>`);
      continue;
    }
    if (trimmed.startsWith('# ')) {
      if (inList) {
        processedLines.push(`<${listType}>${listItems.join('')}</${listType}>`);
        listItems = [];
        inList = false;
        listType = null;
      }
      processedLines.push(`<h1>${processInlineFormatting(trimmed.substring(2))}</h1>`);
      continue;
    }

    // Check for unordered list
    const ulMatch = trimmed.match(/^[\*\-\+] (.+)$/);
    if (ulMatch) {
      const content = ulMatch[1];
      if (!inList || listType !== 'ul') {
        if (inList && listType === 'ol') {
          // Close ordered list, start unordered
          processedLines.push(`<${listType}>${listItems.join('')}</${listType}>`);
          listItems = [];
        }
        inList = true;
        listType = 'ul';
      }
      listItems.push(`<li>${processInlineFormatting(content)}</li>`);
      continue;
    }

    // Check for ordered list
    const olMatch = trimmed.match(/^\d+\. (.+)$/);
    if (olMatch) {
      const content = olMatch[1];
      if (!inList || listType !== 'ol') {
        if (inList && listType === 'ul') {
          // Close unordered list, start ordered
          processedLines.push(`<${listType}>${listItems.join('')}</${listType}>`);
          listItems = [];
        }
        inList = true;
        listType = 'ol';
      }
      listItems.push(`<li>${processInlineFormatting(content)}</li>`);
      continue;
    }

    // Empty line - close list if open
    if (trimmed === '') {
      if (inList) {
        processedLines.push(`<${listType}>${listItems.join('')}</${listType}>`);
        listItems = [];
        inList = false;
        listType = null;
      }
      processedLines.push('');
      continue;
    }

    // Regular paragraph line
    if (inList) {
      // Close list before paragraph
      processedLines.push(`<${listType}>${listItems.join('')}</${listType}>`);
      listItems = [];
      inList = false;
      listType = null;
    }
    processedLines.push(processInlineFormatting(trimmed));
  }

  // Close any remaining list
  if (inList) {
    processedLines.push(`<${listType}>${listItems.join('')}</${listType}>`);
  }

  // Join lines and wrap paragraphs
  let html = processedLines.join('\n');
  
  // Split by double newlines to create paragraphs
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs.map(para => {
    para = para.trim();
    if (!para) return '';
    
    // Don't wrap if it's already a block element
    if (para.startsWith('<') && (
      para.startsWith('<ul>') || 
      para.startsWith('<ol>') || 
      para.startsWith('<h1>') || 
      para.startsWith('<h2>') || 
      para.startsWith('<h3>')
    )) {
      return para;
    }
    
    // Convert single newlines to <br>
    para = para.replace(/\n/g, '<br>');
    return `<p>${para}</p>`;
  }).filter(p => p).join('\n');

  return html;
};

/**
 * Process inline formatting (bold, italic)
 */
function processInlineFormatting(text) {
  // Convert bold (**text** or __text__) - do this first
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  // Convert italic (*text* or _text_) - but not if it's part of bold
  // Use a simpler approach: single * or _ for italic
  text = text.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>');
  text = text.replace(/(?<!_)_([^_\n]+?)_(?!_)/g, '<em>$1</em>');
  
  return text;
}
