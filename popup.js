// 팝업 스크립트

// 탭 전환 기능
document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');

      // 모든 탭 버튼과 콘텐츠 비활성화
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // 선택된 탭 활성화
      button.classList.add('active');
      document.getElementById(`${targetTab}Tab`).classList.add('active');
    });
  });

  // 페이지 정보 로드
  loadPageInfo();
  
  // 화면 표시 버튼 이벤트 (DOM이 준비된 후)
  setupOverlayButtons();
});

// 오버레이 버튼 설정
function setupOverlayButtons() {
  const showOverlayButtons = document.querySelectorAll('.show-overlay-btn');
  showOverlayButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const type = button.getAttribute('data-type');
      const isActive = button.classList.contains('active');
      
      if (isActive) {
        await hideOverlayOnPage();
        button.textContent = '화면에 표시';
        button.classList.remove('active');
      } else {
        await showOverlayOnPage(type);
        button.textContent = '숨기기';
        button.classList.add('active');
      }
    });
  });
}

// 현재 탭에서 페이지 정보 가져오기
async function loadPageInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      showError('탭 정보를 가져올 수 없습니다.');
      return;
    }
    
    chrome.tabs.sendMessage(tab.id, { action: 'getPageInfo' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
        showError('페이지 정보를 가져올 수 없습니다. 페이지를 새로고침해주세요.');
        return;
      }

      if (response) {
        console.log('Page info received:', response);
        displayPageInfo(response);
      } else {
        console.error('No response received');
        showError('페이지 정보를 받지 못했습니다.');
      }
    });
  } catch (error) {
    console.error('Error loading page info:', error);
    showError('오류가 발생했습니다: ' + error.message);
  }
}

// 페이지 정보 표시
function displayPageInfo(data) {
  console.log('Displaying page info:', data);
  
  // 페이지 제목 표시
  const pageTitleEl = document.getElementById('pageTitle');
  if (pageTitleEl) {
    pageTitleEl.textContent = data.title || '제목 없음';
  }

  // H태그 표시
  if (data.headings && Array.isArray(data.headings)) {
    displayHeadings(data.headings);
  } else {
    displayHeadings([]);
  }
  
  // Alt Text 표시
  if (data.altTexts && Array.isArray(data.altTexts)) {
    displayAltTexts(data.altTexts);
  } else {
    displayAltTexts([]);
  }
  
  // Section 표시
  if (data.sections && Array.isArray(data.sections)) {
    displaySections(data.sections);
  } else {
    displaySections([]);
  }
  
  // 버튼 이벤트 재설정 (데이터 표시 후)
  setupOverlayButtons();
}

// H태그 표시
function displayHeadings(headings) {
  const container = document.getElementById('headingsList');
  const countElement = document.getElementById('headingsCount');
  
  countElement.textContent = headings.length;

  if (headings.length === 0) {
    container.innerHTML = '<div class="empty">H태그가 없습니다.</div>';
    return;
  }

  container.innerHTML = headings.map((heading, index) => {
    return `
      <div class="item heading-item">
        <div class="item-header">
          <span class="tag-badge tag-${heading.tag.toLowerCase()}">${heading.tag}</span>
          <span class="item-index">#${index + 1}</span>
        </div>
        <div class="item-content">${escapeHtml(heading.text) || '(빈 텍스트)'}</div>
      </div>
    `;
  }).join('');
}

// Alt Text 표시
function displayAltTexts(altTexts) {
  const container = document.getElementById('altTextsList');
  const countElement = document.getElementById('altTextsCount');
  
  countElement.textContent = altTexts.length;

  if (altTexts.length === 0) {
    container.innerHTML = '<div class="empty">Alt text가 있는 이미지가 없습니다.</div>';
    return;
  }

  container.innerHTML = altTexts.map((img, index) => {
    const shortSrc = img.src.length > 50 ? img.src.substring(0, 50) + '...' : img.src;
    return `
      <div class="item alt-item">
        <div class="item-header">
          <span class="item-index">#${index + 1}</span>
        </div>
        <div class="item-content">
          <div class="alt-text"><strong>Alt:</strong> ${escapeHtml(img.alt)}</div>
          <div class="img-src"><strong>Src:</strong> ${escapeHtml(shortSrc)}</div>
        </div>
      </div>
    `;
  }).join('');
}

// Section 표시
function displaySections(sections) {
  const container = document.getElementById('sectionsList');
  const countElement = document.getElementById('sectionsCount');
  
  countElement.textContent = sections.length;

  if (sections.length === 0) {
    container.innerHTML = '<div class="empty">Section이 없습니다.</div>';
    return;
  }

  container.innerHTML = sections.map((section, index) => {
    return `
      <div class="item section-item">
        <div class="item-header">
          <span class="item-index">Section #${index + 1}</span>
          ${section.id ? `<span class="section-id">ID: ${escapeHtml(section.id)}</span>` : ''}
        </div>
        <div class="item-content">
          ${section.heading ? `<div class="section-heading"><strong>제목:</strong> ${escapeHtml(section.heading)}</div>` : ''}
          ${section.className ? `<div class="section-class"><strong>Class:</strong> ${escapeHtml(section.className)}</div>` : ''}
          <div class="section-preview">${escapeHtml(section.textPreview)}</div>
        </div>
      </div>
    `;
  }).join('');
}

// HTML 이스케이프
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 에러 표시
function showError(message) {
  const containers = ['headingsList', 'altTextsList', 'sectionsList'];
  containers.forEach(id => {
    const container = document.getElementById(id);
    if (container) {
      container.innerHTML = `<div class="error">${message}</div>`;
    }
  });
}

// 화면에 오버레이 표시
async function showOverlayOnPage(type) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, { 
      action: 'showOverlay', 
      type: type 
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
        showError('화면 표시 중 오류가 발생했습니다.');
        return;
      }
    });
  } catch (error) {
    console.error('Error showing overlay:', error);
    showError('오류가 발생했습니다.');
  }
}

// 화면 오버레이 숨기기
async function hideOverlayOnPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, { 
      action: 'hideOverlay' 
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
        return;
      }
    });
  } catch (error) {
    console.error('Error hiding overlay:', error);
  }
}
