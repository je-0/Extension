// 페이지에서 정보를 수집하는 스크립트

// h태그 정보 수집
function getHeadings() {
  const headings = [];
  const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  
  headingTags.forEach(tag => {
    const elements = document.querySelectorAll(tag);
    elements.forEach((el, index) => {
      headings.push({
        tag: tag.toUpperCase(),
        text: el.textContent.trim(),
        level: parseInt(tag.charAt(1)),
        index: index
      });
    });
  });
  
  return headings;
}

// alt text 정보 수집
function getAltTexts() {
  const images = [];
  const imgElements = document.querySelectorAll('img[alt]');
  
  imgElements.forEach((img, index) => {
    if (img.alt && img.alt.trim() !== '') {
      images.push({
        src: img.src || img.getAttribute('src') || 'N/A',
        alt: img.alt.trim(),
        index: index
      });
    }
  });
  
  return images;
}

// section 정보 수집
function getSections() {
  const sections = [];
  const sectionElements = document.querySelectorAll('section');
  
  sectionElements.forEach((section, index) => {
    const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
    const id = section.id || null;
    const className = section.className || null;
    
    sections.push({
      index: index,
      id: id,
      className: className,
      heading: heading ? heading.textContent.trim() : null,
      textPreview: section.textContent.trim().substring(0, 100) + '...'
    });
  });
  
  return sections;
}

// 오버레이 표시 관련 변수
let overlayElements = [];
let isOverlayVisible = false;

// 오버레이 스타일 추가
function injectOverlayStyles() {
  if (document.getElementById('extension-overlay-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'extension-overlay-styles';
  style.textContent = `
    .extension-highlight {
      position: relative !important;
      outline: 3px solid #667eea !important;
      outline-offset: 2px !important;
      z-index: 9998 !important;
    }
    
    .extension-overlay {
      position: absolute !important;
      background: rgba(102, 126, 234, 0.95) !important;
      color: white !important;
      padding: 8px 12px !important;
      border-radius: 6px !important;
      font-size: 12px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-weight: 500 !important;
      z-index: 9999 !important;
      pointer-events: none !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
      max-width: 300px !important;
      word-wrap: break-word !important;
      line-height: 1.4 !important;
    }
    
    .extension-overlay::before {
      content: '' !important;
      position: absolute !important;
      width: 0 !important;
      height: 0 !important;
      border: 6px solid transparent !important;
    }
    
    .extension-overlay-top::before {
      bottom: -12px !important;
      left: 20px !important;
      border-top-color: rgba(102, 126, 234, 0.95) !important;
    }
    
    .extension-overlay-bottom::before {
      top: -12px !important;
      left: 20px !important;
      border-bottom-color: rgba(102, 126, 234, 0.95) !important;
    }
  `;
  document.head.appendChild(style);
}

// 요소에 오버레이 추가
function addOverlayToElement(element, text, type) {
  if (!element) return null;
  
  const rect = element.getBoundingClientRect();
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;
  
  // 요소가 화면에 보이지 않으면 스킵
  if (rect.width === 0 && rect.height === 0) return null;
  
  // 오버레이 요소 생성
  const overlay = document.createElement('div');
  overlay.className = 'extension-overlay';
  overlay.textContent = text;
  
  // 위치 계산 (요소 옆에 표시)
  const spaceRight = window.innerWidth - rect.right;
  const spaceLeft = rect.left;
  const spaceBottom = window.innerHeight - rect.bottom;
  const spaceTop = rect.top;
  
  // 오른쪽에 공간이 있으면 오른쪽에, 없으면 왼쪽에
  if (spaceRight > 320) {
    overlay.style.left = (rect.right + scrollX + 10) + 'px';
    overlay.style.top = (rect.top + scrollY) + 'px';
    overlay.classList.add('extension-overlay-top');
  } else if (spaceLeft > 320) {
    overlay.style.left = (rect.left + scrollX - 310) + 'px';
    overlay.style.top = (rect.top + scrollY) + 'px';
    overlay.classList.add('extension-overlay-top');
  } else if (spaceBottom > 120) {
    overlay.style.left = (rect.left + scrollX) + 'px';
    overlay.style.top = (rect.bottom + scrollY + 10) + 'px';
    overlay.classList.add('extension-overlay-bottom');
  } else if (spaceTop > 120) {
    overlay.style.left = (rect.left + scrollX) + 'px';
    overlay.style.bottom = (window.innerHeight - rect.top - scrollY + 10) + 'px';
    overlay.classList.add('extension-overlay-bottom');
  } else {
    // 공간이 부족하면 오른쪽에 강제 배치
    overlay.style.left = (rect.right + scrollX + 10) + 'px';
    overlay.style.top = (rect.top + scrollY) + 'px';
    overlay.classList.add('extension-overlay-top');
  }
  
  document.body.appendChild(overlay);
  element.classList.add('extension-highlight');
  
  return { element, overlay, type };
}

// 오버레이 표시
function showOverlays(type) {
  if (isOverlayVisible) {
    hideOverlays();
  }
  
  injectOverlayStyles();
  overlayElements = [];
  
  if (type === 'headings' || type === 'all') {
    const headings = getHeadings();
    const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    let headingIndex = 0;
    
    headingTags.forEach(tag => {
      const elements = document.querySelectorAll(tag);
      elements.forEach((el) => {
        const heading = headings[headingIndex];
        if (heading) {
          const text = `${heading.tag}: ${heading.text || '(빈 텍스트)'}`;
          const overlay = addOverlayToElement(el, text, 'heading');
          if (overlay) overlayElements.push(overlay);
          headingIndex++;
        }
      });
    });
  }
  
  if (type === 'altTexts' || type === 'all') {
    const altTexts = getAltTexts();
    const imgElements = document.querySelectorAll('img[alt]');
    let imgIndex = 0;
    
    imgElements.forEach((img) => {
      if (img.alt && img.alt.trim() !== '') {
        const altData = altTexts[imgIndex];
        if (altData) {
          const text = `Alt: ${altData.alt}`;
          const overlay = addOverlayToElement(img, text, 'alt');
          if (overlay) overlayElements.push(overlay);
          imgIndex++;
        }
      }
    });
  }
  
  if (type === 'sections' || type === 'all') {
    const sections = getSections();
    const sectionElements = document.querySelectorAll('section');
    
    sectionElements.forEach((section, index) => {
      const sectionData = sections[index];
      if (sectionData) {
        let text = `Section #${index + 1}`;
        if (sectionData.heading) {
          text += `\n제목: ${sectionData.heading}`;
        }
        if (sectionData.id) {
          text += `\nID: ${sectionData.id}`;
        }
        const overlay = addOverlayToElement(section, text, 'section');
        if (overlay) overlayElements.push(overlay);
      }
    });
  }
  
  isOverlayVisible = true;
  
  // 스크롤 시 오버레이 위치 업데이트
  const updateOverlays = () => {
    overlayElements.forEach(({ element, overlay }) => {
      if (!element || !overlay) return;
      
      const rect = element.getBoundingClientRect();
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;
      
      // 요소가 화면에 보이지 않으면 오버레이 숨기기
      if (rect.width === 0 && rect.height === 0) {
        overlay.style.display = 'none';
        return;
      }
      overlay.style.display = '';
      
      const spaceRight = window.innerWidth - rect.right;
      const spaceLeft = rect.left;
      const spaceBottom = window.innerHeight - rect.bottom;
      const spaceTop = rect.top;
      
      // 기존 클래스 제거
      overlay.classList.remove('extension-overlay-top', 'extension-overlay-bottom');
      
      // 위치 재계산
      if (spaceRight > 320) {
        overlay.style.left = (rect.right + scrollX + 10) + 'px';
        overlay.style.top = (rect.top + scrollY) + 'px';
        overlay.style.right = 'auto';
        overlay.style.bottom = 'auto';
        overlay.classList.add('extension-overlay-top');
      } else if (spaceLeft > 320) {
        overlay.style.left = (rect.left + scrollX - 310) + 'px';
        overlay.style.top = (rect.top + scrollY) + 'px';
        overlay.style.right = 'auto';
        overlay.style.bottom = 'auto';
        overlay.classList.add('extension-overlay-top');
      } else if (spaceBottom > 120) {
        overlay.style.left = (rect.left + scrollX) + 'px';
        overlay.style.top = (rect.bottom + scrollY + 10) + 'px';
        overlay.style.right = 'auto';
        overlay.style.bottom = 'auto';
        overlay.classList.add('extension-overlay-bottom');
      } else if (spaceTop > 120) {
        overlay.style.left = (rect.left + scrollX) + 'px';
        overlay.style.bottom = (window.innerHeight - rect.top - scrollY + 10) + 'px';
        overlay.style.right = 'auto';
        overlay.style.top = 'auto';
        overlay.classList.add('extension-overlay-bottom');
      } else {
        overlay.style.left = (rect.right + scrollX + 10) + 'px';
        overlay.style.top = (rect.top + scrollY) + 'px';
        overlay.style.right = 'auto';
        overlay.style.bottom = 'auto';
        overlay.classList.add('extension-overlay-top');
      }
    });
  };
  
  window.addEventListener('scroll', updateOverlays, true);
  window.addEventListener('resize', updateOverlays);
  
  // 저장된 업데이트 함수를 나중에 제거하기 위해 저장
  window._extensionUpdateOverlays = updateOverlays;
}

// 오버레이 숨기기
function hideOverlays() {
  overlayElements.forEach(({ element, overlay }) => {
    if (element) element.classList.remove('extension-highlight');
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  });
  overlayElements = [];
  isOverlayVisible = false;
  
  if (window._extensionUpdateOverlays) {
    window.removeEventListener('scroll', window._extensionUpdateOverlays, true);
    window.removeEventListener('resize', window._extensionUpdateOverlays);
    delete window._extensionUpdateOverlays;
  }
}

// 메시지 리스너 - popup에서 요청 시 데이터 전송
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'getPageInfo') {
    try {
      const headings = getHeadings();
      const altTexts = getAltTexts();
      const sections = getSections();
      
      const pageInfo = {
        headings: headings,
        altTexts: altTexts,
        sections: sections,
        url: window.location.href,
        title: document.title
      };
      
      console.log('Sending page info:', pageInfo);
      sendResponse(pageInfo);
    } catch (error) {
      console.error('Error getting page info:', error);
      sendResponse({ error: error.message });
    }
    return true; // 비동기 응답을 위해 true 반환
  } else if (request.action === 'showOverlay') {
    try {
      showOverlays(request.type);
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error showing overlay:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  } else if (request.action === 'hideOverlay') {
    try {
      hideOverlays();
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error hiding overlay:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
  
  return false;
});
