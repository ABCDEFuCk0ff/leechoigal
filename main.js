import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, doc, deleteDoc, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const resetButton = document.getElementById('reset-button');
const authorSwitch = document.getElementById('author-switch');
const authorSeungho = document.getElementById('author-seungho');
const authorEunseong = document.getElementById('author-eunseong');
const layoutToggle = document.getElementById('layout-toggle-switch');
 
// 작성자 토글 스위치 UI 업데이트 함수
const updateAuthorToggleUI = () => {
     if (authorSwitch.checked) { // 최은성 선택
         authorSeungho.classList.remove('active');
         authorEunseong.classList.add('active');
     } else { // 이승호 선택
         authorSeungho.classList.add('active');
         authorEunseong.classList.remove('active');
     }
};
 
// 이벤트 리스너 연결
authorSwitch.addEventListener('change', updateAuthorToggleUI);
authorSeungho.addEventListener('click', () => {
     authorSwitch.checked = false;
     updateAuthorToggleUI();
});
authorEunseong.addEventListener('click', () => {
     authorSwitch.checked = true;
     updateAuthorToggleUI();
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
 
// 실시간 게시물 목록 감지 및 렌더링
const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
const unsubscribe = onSnapshot(q, (snapshot) => {
    postListBody.innerHTML = '';
 
    if (snapshot.empty) {
         const row = document.createElement('tr');
         row.innerHTML = `<td colspan="5" style="padding: 30px 0; color: #999;">등록된 게시글이 없습니다.</td>`;
         postListBody.appendChild(row);
         return;
     }
 
    // 번호 매기기 (전체 개수 - 인덱스)
    let index = snapshot.size;
 
    snapshot.forEach((docSnapshot) => {
         const post = docSnapshot.data();
         const postId = docSnapshot.id; // Firestore 문서 ID
        
         const row = document.createElement('tr');
         row.dataset.id = postId;
         row.innerHTML = `
             <td style="color: #888; font-size: 12px;">${index--}</td>
             <td class="post-title-cell" style="text-align: left; padding-left: 20px;"><a href="detail.html?id=${postId}">${post.title}</a></td>
             <td>${post.author}</td>
             <td style="color: #888; font-size: 12px;">${formatTimestamp(post.createdAt)}</td>
             <td><button class="btn-delete-row" data-id="${postId}">삭제</button></td>
         `;
         postListBody.appendChild(row);
     });
});
 
// 폼 제출 이벤트 핸들러
postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
 
    const title = document.getElementById('title').value;
    const author = authorSwitch.checked ? '최은성' : '이승호';
    const content = document.getElementById('content').value;
 
    if (!title || !content) {
         alert("제목과 내용을 모두 입력해주세요.");
         return;
     }
 
    try {
         await addDoc(collection(db, "posts"), {
             title: title,
             author: author,
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
 
// 전체 삭제 버튼 이벤트 핸들러
resetButton.addEventListener('click', async () => {
    if (confirm('모든 게시물을 정말로 삭제하시겠습니까? (복구 불가)')) {
         try {
             const querySnapshot = await getDocs(collection(db, "posts"));
             const batch = writeBatch(db);
            
             querySnapshot.forEach((doc) => {
                 batch.delete(doc.ref);
             });
 
             await batch.commit();
             alert('모든 게시물이 삭제되었습니다.');
         } catch (error) {
             console.error("Error deleting documents: ", error);
             alert("삭제 중 오류가 발생했습니다.");
         }
     }
});
 
// 이벤트 위임: 목록 클릭 (삭제)
postListBody.addEventListener('click', async (e) => {
    if (e.target.classList.contains('btn-delete-row')) {
         const postId = e.target.dataset.id;
         if (confirm('이 게시물을 삭제하시겠습니까?')) {
             try {
                 await deleteDoc(doc(db, "posts", postId));
                 // onSnapshot이 자동으로 UI 업데이트함
             } catch (error) {
                 console.error("Error removing document: ", error);
                 alert("삭제 실패");
             }
         }
     }
});
 
// 페이지 로드 시 초기 렌더링
updateAuthorToggleUI();

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