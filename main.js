import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCnTxGemcsrYzwB14Wx-70zS_w7Wz3QLIo",
    authDomain: "leechoigal.firebaseapp.com",
    projectId: "leechoigal",
    storageBucket: "leechoigal.firebasestorage.app",
    messagingSenderId: "277228004101",
    appId: "1:277228004101:web:f756533199e6ee6bd9cd6c",
    measurementId: "G-S55YH5YFXQ"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM 요소 선택
const mainContainer = document.querySelector('.main-container');
const postForm = document.getElementById('post-form');
const postListBody = document.getElementById('post-list-body');
const submitButton = document.getElementById('submit-button');
const authorSwitch = document.getElementById('author-switch');
const authorSeungho = document.getElementById('author-seungho');
const authorEunseong = document.getElementById('author-eunseong');
const layoutToggle = document.getElementById('layout-toggle-switch');
const categoryToggle = document.getElementById('category-toggle');
const categoryFree = document.getElementById('category-free');
const categoryStudy = document.getElementById('category-study');

// 글 작성 폼 카테고리 토글 요소
const formCategoryToggle = document.getElementById('form-category-toggle');
const formCategoryFree = document.getElementById('form-category-free');
const formCategoryStudy = document.getElementById('form-category-study');
 
// 작성자 선택 상태 변수 (null: 선택안함, '이승호', '최은성')
let selectedAuthor = null;

// 작성자 토글 스위치 UI 업데이트 함수
const updateAuthorToggleUI = () => {
    const wrapper = authorSwitch.closest('.pill-toggle-wrapper');
    
    if (selectedAuthor === null) {
        // 선택 안 된 중립 상태
        wrapper.classList.add('neutral');
        authorSeungho.classList.remove('active');
        authorEunseong.classList.remove('active');
        submitButton.disabled = true; // 등록 버튼 비활성화
    } else {
        // 선택된 상태
        wrapper.classList.remove('neutral');
        submitButton.disabled = false; // 등록 버튼 활성화

        if (selectedAuthor === '최은성') {
            authorSwitch.checked = true;
            authorSeungho.classList.remove('active');
            authorEunseong.classList.add('active');
        } else {
            authorSwitch.checked = false;
            authorSeungho.classList.add('active');
            authorEunseong.classList.remove('active');
        }
    }
};
 
// 이벤트 리스너 연결
// authorSwitch(체크박스) change 이벤트 대신 명시적 클릭 이벤트 사용
authorSeungho.addEventListener('click', () => {
     selectedAuthor = '이승호';
     updateAuthorToggleUI();
});
authorEunseong.addEventListener('click', () => {
     selectedAuthor = '최은성';
     updateAuthorToggleUI();
});

// 글 작성 폼 카테고리 토글 UI 업데이트 함수
const updateFormCategoryToggleUI = () => {
    if (formCategoryToggle.checked) { // 공부 선택
        formCategoryFree.classList.remove('active');
        formCategoryStudy.classList.add('active');
    } else { // 자유 선택 (기본)
        formCategoryFree.classList.add('active');
        formCategoryStudy.classList.remove('active');
    }
};

// 글 작성 폼 카테고리 이벤트 리스너
formCategoryToggle.addEventListener('change', updateFormCategoryToggleUI);
formCategoryFree.addEventListener('click', () => { formCategoryToggle.checked = false; updateFormCategoryToggleUI(); });
formCategoryStudy.addEventListener('click', () => { formCategoryToggle.checked = true; updateFormCategoryToggleUI(); });


// 카테고리(자유/공부) 토글 UI 업데이트 함수
const updateCategoryToggleUI = () => {
    if (categoryToggle.checked) { // 공부 선택
        categoryFree.classList.remove('active');
        categoryStudy.classList.add('active');
    } else { // 자유 선택
        categoryFree.classList.add('active');
        categoryStudy.classList.remove('active');
    }
};

// 카테고리 토글 이벤트 리스너
categoryToggle.addEventListener('change', updateCategoryToggleUI);
categoryFree.addEventListener('click', () => {
    categoryToggle.checked = false;
    updateCategoryToggleUI();
    renderPostList(); // 탭 변경 시 목록 갱신
});
categoryStudy.addEventListener('click', () => {
    categoryToggle.checked = true;
    updateCategoryToggleUI();
    renderPostList(); // 탭 변경 시 목록 갱신
});

// 레이아웃 변경 함수
const setLayout = (isVertical) => {
    if (isVertical) {
        mainContainer.classList.add('vertical-view');
        layoutToggle.checked = true;
    } else {
        mainContainer.classList.remove('vertical-view');
        layoutToggle.checked = false;
    }
};

// 레이아웃 토글 이벤트 리스너
layoutToggle.addEventListener('change', () => {
    localStorage.setItem('layoutPreference', layoutToggle.checked ? 'vertical' : 'horizontal');
    setLayout(layoutToggle.checked);
});

// 날짜/시간 포맷팅 함수
const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    // Firestore Timestamp 객체인 경우 Date로 변환
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    // 한국 시간 포맷
    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace(/\. /g, '.').replace(',', ''); // 포맷 다듬기
};
 
// 게시글 목록 렌더링 함수 (필터링 적용)
let allPostsData = []; // 불러온 데이터를 저장할 전역 변수

const renderPostList = () => {
    postListBody.innerHTML = '';

    // 현재 헤더 탭에 따라 필터링 (체크됨=공부, 해제됨=자유)
    const targetCategory = categoryToggle.checked ? '공부' : '자유';
    
    // 기존 글(category 필드 없는 경우)은 '자유'로 처리
    const filteredPosts = allPostsData.filter(post => {
        const postCategory = post.data.category || '자유'; 
        return postCategory === targetCategory;
    });

    if (filteredPosts.length === 0) {
         const row = document.createElement('tr');
         row.innerHTML = `<td colspan="4" style="padding: 30px 0; color: #999;">등록된 게시글이 없습니다.</td>`;
         postListBody.appendChild(row);
         return;
     }

    let index = filteredPosts.length;
    filteredPosts.forEach((item) => {
         const post = item.data;
         const postId = item.id;
        
         const row = document.createElement('tr');
         row.dataset.id = postId;
         row.innerHTML = `
             <td style="color: #888; font-size: 12px;">${index--}</td>
             <td class="post-title-cell" style="text-align: left; padding-left: 20px;"><a href="detail.html?id=${postId}">${post.title}</a></td>
             <td>${post.author}</td>
             <td style="color: #888; font-size: 12px;">${formatTimestamp(post.createdAt)}</td>
         `;
         postListBody.appendChild(row);
     });
};

// 실시간 게시물 목록 감지 및 렌더링
const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
const unsubscribe = onSnapshot(q, (snapshot) => {
    allPostsData = []; // 데이터 초기화
    snapshot.forEach((docSnapshot) => {
         allPostsData.push({
             id: docSnapshot.id,
             data: docSnapshot.data()
         });
     });
    renderPostList(); // 데이터 갱신 후 렌더링
});
 
// 폼 제출 이벤트 핸들러
postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
 
    const title = document.getElementById('title').value;
    const author = selectedAuthor; // 전역 변수에서 가져옴
    const category = formCategoryToggle.checked ? '공부' : '자유'; // 카테고리 값 가져오기
    const content = document.getElementById('content').value;
 
    if (!title || !content) {
         alert("제목과 내용을 모두 입력해주세요.");
         return;
     }
 
    try {
         await addDoc(collection(db, "posts"), {
             title: title,
             author: author,
             category: category, // 카테고리 필드 추가
             content: content,
             createdAt: serverTimestamp(),
             comments: [] // 댓글 배열 초기화
         });
        
         alert("게시글이 등록되었습니다.");
         postForm.reset();
         // 작성자 토글 상태는 유지하거나 초기화 (여기선 유지)
     } catch (error) {
         console.error("Error adding document: ", error);
         alert("글 저장 중 오류가 발생했습니다.");
     }
});
 
// 페이지 로드 시 초기 렌더링
updateAuthorToggleUI();
updateFormCategoryToggleUI();

// 페이지 로드 시 레이아웃 설정
const savedLayout = localStorage.getItem('layoutPreference');
if (savedLayout === 'vertical') {
    setLayout(true);
} else if (savedLayout === 'horizontal') {
    setLayout(false);
} else {
    // 저장된 설정이 없으면 화면 너비에 따라 결정 (모바일 우선)
    setLayout(window.innerWidth <= 768);
}