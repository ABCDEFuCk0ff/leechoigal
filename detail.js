import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소 선택
    const postViewTitle = document.getElementById('post-view-title');
    const postViewAuthor = document.getElementById('post-view-author');
    const postViewDate = document.getElementById('post-view-date');
    const postViewContent = document.getElementById('post-view-content');
    const commentList = document.getElementById('comment-list');
    const commentForm = document.getElementById('comment-form');
    const commentInput = document.getElementById('comment-input');
    const detailDeleteButton = document.getElementById('detail-delete-button');
 
    // 댓글 작성자 토글 요소
    const commentAuthorSwitch = document.getElementById('comment-author-switch');
    const commentAuthorSeungho = document.getElementById('comment-author-seungho');
    const commentAuthorEunseong = document.getElementById('comment-author-eunseong');
 
    // URL에서 게시물 ID 가져오기 (Firestore ID는 문자열이므로 Number() 제거)
    const urlParams = new URLSearchParams(window.location.search);
    const currentPostId = urlParams.get('id');
 
    if (!currentPostId) {
         alert('잘못된 접근입니다.');
         window.location.href = 'index.html';
         return;
     }
 
    // 날짜 포맷팅 함수
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(/\. /g, '.').replace(',', '');
    };
 
    // 댓글 작성자 토글 UI 업데이트 함수
    const updateCommentAuthorToggleUI = () => {
         if (commentAuthorSwitch.checked) { // 최은성 선택
             commentAuthorSeungho.classList.remove('active');
             commentAuthorEunseong.classList.add('active');
         } else { // 이승호 선택
             commentAuthorSeungho.classList.add('active');
             commentAuthorEunseong.classList.remove('active');
         }
    };
 
    // 댓글 렌더링 함수
    const renderComments = (comments) => {
         commentList.innerHTML = '';
         if (!comments || comments.length === 0) {
             commentList.innerHTML = '<p class="no-comments" style="color: #999; text-align: center; padding: 20px 0;">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>';
             return;
         }
 
        comments.forEach(comment => {
             const commentItem = document.createElement('div');
             commentItem.className = 'comment-item';
             // 줄바꿈 처리
            const formattedText = comment.text.replace(/\n/g, '<br>');
            
             commentItem.innerHTML = `
                 <div class="comment-author">${comment.author}</div>
                 <div class="comment-text">${formattedText}</div>
                 <div class="comment-date">${formatTimestamp(comment.createdAt)}</div>
             `;
             commentList.appendChild(commentItem);
         });
    };
 
    // 실시간 데이터 리스너 (게시글 및 댓글 업데이트 감지)
    const postRef = doc(db, "posts", currentPostId);
    
    onSnapshot(postRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
             const post = docSnapshot.data();
            
             document.title = post.title;
             postViewTitle.textContent = post.title;
             postViewAuthor.textContent = post.author;
             postViewDate.textContent = formatTimestamp(post.createdAt);
             // 본문 줄바꿈 처리
            postViewContent.innerHTML = post.content.replace(/\n/g, '<br>');
 
             renderComments(post.comments);
         } else {
             alert('삭제되었거나 존재하지 않는 게시물입니다.');
             window.location.href = 'index.html';
         }
     }, (error) => {
         console.error("Error getting document:", error);
         alert("게시물을 불러오는 중 오류가 발생했습니다.");
     });
 
    // 이벤트 리스너
    commentAuthorSwitch.addEventListener('change', updateCommentAuthorToggleUI);
    commentAuthorSeungho.addEventListener('click', () => {
         commentAuthorSwitch.checked = false;
         updateCommentAuthorToggleUI();
    });
    commentAuthorEunseong.addEventListener('click', () => {
         commentAuthorSwitch.checked = true;
         updateCommentAuthorToggleUI();
    });
 
    // 게시글 삭제
    detailDeleteButton.addEventListener('click', async () => {
         if (confirm('이 게시물을 삭제하시겠습니까?')) {
             try {
                 await deleteDoc(postRef);
                 alert('게시물이 삭제되었습니다.');
                 window.location.href = 'index.html';
             } catch (error) {
                 console.error("Error deleting document: ", error);
                 alert("삭제 실패");
             }
         }
     });
 
    // 댓글 작성
    commentForm.addEventListener('submit', async (e) => {
         e.preventDefault();
         const commentText = commentInput.value.trim();
         if (!commentText) return;
 
         const commentAuthor = commentAuthorSwitch.checked ? '최은성' : '이승호';
 
         const newComment = {
             id: Date.now(), // 댓글 고유 ID (필요시 사용)
             author: commentAuthor,
             text: commentText,
             createdAt: new Date() // 댓글 시간은 클라이언트 시간 사용 (단순화)
         };
 
         try {
             await updateDoc(postRef, {
                 comments: arrayUnion(newComment)
             });
             commentInput.value = '';
         } catch (error) {
             console.error("Error adding comment: ", error);
             alert("댓글 등록 실패");
         }
     });
 
    // 초기 UI 설정
    updateCommentAuthorToggleUI();
});