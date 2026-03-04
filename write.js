document.getElementById('writeForm').addEventListener('submit', function(e) {
    e.preventDefault(); // 기본 제출 동작 방지

    const urlParams = new URLSearchParams(window.location.search);
    const boardType = urlParams.get('board'); // 'free' 또는 null

    const title = document.getElementById('title').value;
    const author = document.querySelector('input[name="author"]:checked').value;
    const content = document.getElementById('content').value;

    // 게시물 저장 함수
    const savePost = () => {
        const key = boardType === 'free' ? 'freeBoardPosts' : 'galleryPosts';
        // 기존 게시물 가져오기 (없으면 빈 배열)
        const posts = JSON.parse(localStorage.getItem(key)) || [];

        const newPost = {
            id: Date.now(), // 고유 ID
            title: title,
            content: content,
            author: author,
            date: Date.now() // 현재 시간을 timestamp로 저장
        };

        posts.unshift(newPost);
        localStorage.setItem(key, JSON.stringify(posts));

        const redirectUrl = boardType === 'free' ? 'index.html#free' : 'index.html';
        window.location.href = redirectUrl;
    };

    savePost();
});