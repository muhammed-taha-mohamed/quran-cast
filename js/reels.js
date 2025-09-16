// Reels functionality for Quran Cast app
class ReelsManager {
    constructor() {
        this.firebaseConfig = {
            apiKey: "AIzaSyAhlJMOnTcJeohztnvYC2SMJU7NOAxKmus",
            authDomain: "quran-cast.firebaseapp.com",
            projectId: "quran-cast",
            storageBucket: "quran-cast.firebasestorage.app",
            messagingSenderId: "782388777938",
            appId: "1:782388777938:web:1204e3fbd58d7ad9ed2e0b",
            measurementId: "G-4J9108LV23"
        };

        this.db = null;
        this.auth = null;
        this.currentVideoIndex = 0;
        this.videos = [];
        this.isInitialized = false;
        this.currentUser = null;
        this.firebaseListeners = []; // Array to store Firebase listeners for cleanup
        this.debounceTimers = {}; // Object to store debounce timers
    }

    // Cleanup Firebase listeners
    cleanupFirebaseListeners() {
        this.firebaseListeners.forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.firebaseListeners = [];

        // Cleanup debounce timers
        Object.values(this.debounceTimers).forEach(timer => {
            if (timer) {
                clearTimeout(timer);
            }
        });
        this.debounceTimers = {};
    }

    // Debounce function to prevent excessive API calls
    debounce(func, delay, key) {
        if (this.debounceTimers[key]) {
            clearTimeout(this.debounceTimers[key]);
        }
        this.debounceTimers[key] = setTimeout(() => {
            func();
            delete this.debounceTimers[key];
        }, delay);
    }

    // Ensure Firebase is initialized before auth operations
    async ensureFirebaseInitialized() {
        if (!this.isInitialized || !this.auth || !this.db) {
            console.log('Ensuring Firebase initialization...');
            await this.initialize();
        }
    }

    async initialize() {
        if (this.isInitialized && this.auth && this.db) {
            console.log('Firebase already initialized');
            return;
        }

        try {
            // Cleanup existing listeners first
            this.cleanupFirebaseListeners();

            // Initialize Firebase
            if (typeof firebase === 'undefined') {
                console.log('Loading Firebase scripts...');
                await this.loadFirebaseScripts();
            }

            console.log('Initializing Firebase...');
            
            // Check if Firebase app is already initialized
            if (!firebase.apps.length) {
                firebase.initializeApp(this.firebaseConfig);
            }
            
            this.db = firebase.firestore();
            this.auth = firebase.auth();
            this.isInitialized = true;

            console.log('Firebase initialized successfully');

            // لا نحذف البيانات القديمة - هذا خطأ!
            // console.log('Migrating old data...');
            // await this.migrateOldData();

            // فحص redirect result
            console.log('Checking redirect result...');
            await this.checkRedirectResult();

            // فحص حالة المصادقة المحفوظة
            console.log('Checking auth state...');
            await this.checkAuthState();

            // تحديث عدد التعليقات سيتم بعد تحميل المنشورات

            console.log('Reels manager initialized successfully');
        } catch (error) {
            console.error('Error initializing reels manager:', error);
            // إعادة تعيين حالة التهيئة في حالة الخطأ
            this.isInitialized = false;
            this.db = null;
            this.auth = null;
            throw error;
        }
    }

    async loadFirebaseScripts() {
        return new Promise((resolve, reject) => {
            const script1 = document.createElement('script');
            script1.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
            script1.onload = () => {
                const script2 = document.createElement('script');
                script2.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js';
                script2.onload = () => {
                    const script3 = document.createElement('script');
                    script3.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js';
                    script3.onload = resolve;
                    script3.onerror = reject;
                    document.head.appendChild(script3);
                };
                script2.onerror = reject;
                document.head.appendChild(script2);
            };
            script1.onerror = reject;
            document.head.appendChild(script1);
        });
    }

    async loadPosts() {
        if (!this.db) {
            console.error('Firebase not initialized');
            throw new Error('Firebase not initialized');
        }

        try {
            console.log('Loading posts from Firestore...');
            const snapshot = await this.db.collection("posts")
                .orderBy("date", "desc")
                .get();

            this.posts = [];
            snapshot.forEach(doc => {
                this.posts.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log(`Loaded ${this.posts.length} posts from Firestore`);
            return this.posts;
        } catch (error) {
            console.error('Error loading posts from Firestore:', error);
            throw error;
        }
    }

    renderReelsSection() {
        // Scroll to top when rendering reels section
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });

        const reelsSection = document.getElementById('reels_section');
        if (!reelsSection) return;

        reelsSection.innerHTML = `
            <div class="reels-container">
                <div class="reels-header">
                </div>
                
                <div class="reels-content">
                    <div class="reels-grid" id="reelsGrid">
                        <div class="reels-loading">
                        
                            <p>جاري التحميل</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.loadAndDisplayPosts();
    }

    async loadAndDisplayPosts() {
        // Scroll to top when loading posts
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });

        const reelsGrid = document.getElementById('reelsGrid');
        if (!reelsGrid) {
            console.error('reelsGrid element not found');
            return;
        }

        // Show loading animation
        this.showLoadingAnimation(reelsGrid);

        try {
            // التحقق من تهيئة Firebase
            if (!this.db) {
                console.error('Firebase not initialized, attempting to initialize...');
                await this.initialize();
                if (!this.db) {
                    throw new Error('Failed to initialize Firebase');
                }
            }

            const posts = await this.loadPosts();
            console.log('Loaded posts:', posts);

            if (!posts || posts.length === 0) {
                reelsGrid.innerHTML = `
                    <div class="reels-empty">
                        <i class="bi bi-grid-3x3-gap display-1 text-muted"></i>
                        <h4 class="mt-3">لا توجد منشورات متاحة</h4>
                    </div>
                `;
                return;
            }

            // تصفية المنشورات التي تحتوي على محتوى صالح
            const validPosts = posts;

            console.log('Valid posts:', validPosts);

            // Hide loading animation
            this.hideLoadingAnimation();

            if (validPosts.length === 0) {
                reelsGrid.innerHTML = `
                    <div class="reels-empty">
                        <i class="bi bi-exclamation-triangle display-1 text-warning"></i>
                        <h4 class="mt-3">لا توجد منشورات صالحة</h4>
                        <p class="text-muted">جميع المنشورات تحتوي على أخطاء في البيانات</p>
                    </div>
                `;
                return;
            }

            // عرض المنشورات مع أنيميشن
            await this.displayPostsWithAnimation(reelsGrid, validPosts);

            // تحديث حالة الإعجاب بعد تحميل المنشورات
            this.updateAllLikesUI(validPosts);

            // تحديث عدد التعليقات لجميع المنشورات
            await this.updateAllCommentCounts();

        } catch (error) {
            console.error('Error displaying posts:', error);
            this.hideLoadingAnimation();
            reelsGrid.innerHTML = `
                <div class="reels-error">
                    <i class="bi bi-exclamation-triangle display-1 text-warning"></i>
                    <h4 class="mt-3">خطأ في تحميل المنشورات</h4>
                    <p class="text-muted">حدث خطأ أثناء تحميل المنشورات: ${error.message}</p>
                    <button class="btn btn-primary mt-2" onclick="reelsManager.loadAndDisplayPosts()">
                        <i class="bi bi-arrow-clockwise me-2"></i>إعادة المحاولة
                    </button>
                </div>
            `;
        }
    }

    async renderFacebookStylePost(post, index) {
        const contentType = post.type || post.contentType;
        const contentTypeIcon = this.getContentTypeIcon(contentType);
        const currentUserName = this.currentUser ? (this.currentUser.displayName || 'مجهول').trim() : 'مجهول';
        const postUsername = (post.username || '').trim();
        const currentUserId = this.currentUser ? (this.currentUser.uid || this.currentUser.email) : null;
        const isOwner = this.currentUser && (
            postUsername === currentUserName ||
            postUsername === this.currentUser.displayName?.trim() ||
            (this.currentUser.email && postUsername === this.currentUser.email) ||
            (post.userId && post.userId === currentUserId) ||
            (!post.userId && postUsername === currentUserName) // للمنشورات القديمة
        );

        // جلب معلومات المستخدم للحصول على الصورة الشخصية
        let userProfilePicture = null;
        if (post.userId && this.db) {
            try {
                const userDoc = await this.db.collection('users').doc(post.userId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    userProfilePicture = userData.profilePicture;
                }
            } catch (error) {
                console.error('خطأ في جلب معلومات المستخدم:', error);
            }
        }

        // إنشاء HTML للصورة الشخصية
        const avatarHTML = userProfilePicture
            ? `<img src="${userProfilePicture}" alt="صورة المستخدم" class="post-avatar-img" onclick="showUserProfile('${post.userId || ''}', '${post.username || 'مجهول'}')">`
            : `<img src="${this.createDefaultAvatar(post.username || 'مجهول')}" alt="صورة المستخدم" class="post-avatar-img" onclick="showUserProfile('${post.userId || ''}', '${post.username || 'مجهول'}')">`;

        return `
            <div class="facebook-post" data-post-index="${index}">
                <!-- Post Header -->
                <div class="post-header">
                    <div class="post-user-info">
                        <div class="post-avatar clickable-avatar" onclick="showUserProfile('${post.userId || ''}', '${post.username || 'مجهول'}')">
                            ${avatarHTML}
                        </div>
                        <div class="post-user-details">
                            <div class="post-username clickable-username" onclick="showUserProfile('${post.userId || ''}', '${post.username || 'مجهول'}')">${post.username || 'مجهول'}</div>
                            <div class="post-meta">
                                <span class="post-time">${this.formatDate(post.date)}</span>
                                
                            </div>
                        </div>
                    </div>
                    <div class="post-actions-menu">
                        ${isOwner ? `
                            <button class="post-delete-btn" onclick="reelsManager.deletePost(${index})" title="حذف المنشور">
                                <i class="bi bi-trash"></i>
                            </button>
                        ` : `
                            <button class="post-share-btn" onclick="reelsManager.sharePost('${post.text || post.image || post.video}', '${contentType}')" title="مشاركة">
                                <i class="bi bi-share"></i>
                            </button>
                        `}
                    </div>
                </div>

                <!-- Post Content -->
                <div class="post-content">
                    ${this.renderPostContent(post, index)}
                </div>

                <!-- Post Actions -->
                <div class="post-actions">
                    ${this.renderPostActions(post, index)}
                </div>
            </div>
        `;
    }

    renderPostContent(post, index) {
        // التحقق من نوع المحتوى من الحقل الجديد 'type'
        const contentType = post.type || post.contentType;

        if (contentType === 'text' && post.text) {
            return `
                <div class="post-text">
                    <p style="white-space: pre-wrap; word-wrap: break-word;">${post.text}</p>
                </div>
            `;
        } else if (contentType === 'image' && post.image) {
            return `
                <div class="post-image-container">
                    <img src="${post.image}" alt="صورة منشور" class="post-image" onclick="reelsManager.openFullscreen('${post.image}', 'image')" style="cursor: pointer;">
                </div>
            `;
        } else if (contentType === 'video' && post.video) {
            return `
                <div class="post-video-container">
                    <video 
                        class="post-video" 
                        preload="metadata"
                        loop
                        autoplay
                        playsinline
                        webkit-playsinline
                        controls="false"
                        poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPvCfj4Qg2KfZhNio2YjYp9mE2KfYqTwvdGV4dD48L3N2Zz4="
                        data-video-index="${index}"
                        style="cursor: default;"
                    >
                        <source src="${post.video}" type="video/mp4">
                        متصفحك لا يدعم تشغيل الفيديو
                    </video>
                    <div class="video-overlay">
                        <button class="video-play-btn" onclick="reelsManager.openFullscreen('${post.video}', 'video')" data-video-index="${index}">
                            <i class="bi bi-play-circle-fill"></i>
                        </button>
                    </div>
                </div>
            `;
        } else {
            // عرض رسالة خطأ إذا لم يتم العثور على المحتوى
            return `
                <div class="post-error">
                    <p>⚠️ خطأ في عرض المحتوى</p>
                </div>
            `;
        }
    }

    getContentTypeIcon(contentType) {
        switch (contentType) {
            case 'text': return 'bi bi-pencil-square';
            case 'image': return 'bi bi-image';
            case 'video': return 'bi bi-camera-video';
            default: return 'bi bi-file';
        }
    }

    getContentTypeText(contentType) {
        switch (contentType) {
            case 'text': return 'منشور نصي';
            case 'image': return 'صورة';
            case 'video': return 'فيديو';
            default: return 'منشور';
        }
    }

    renderPostActions(post, index) {
        const contentType = post.type || post.contentType;
        const likes = post.likes || [];
        const likeCount = likes.length;
        const currentUserId = this.currentUser ? (this.currentUser.uid || this.currentUser.email) : null;
        const isLiked = currentUserId && likes.includes(currentUserId);
        const currentUserName = this.currentUser ? (this.currentUser.displayName || 'مجهول') : 'مجهول';
        const isOwner = this.currentUser && (
            post.username === currentUserName ||
            post.username === this.currentUser.displayName ||
            (this.currentUser.email && post.username === this.currentUser.email) ||
            (post.userId && post.userId === currentUserId)
        );

        // أزرار الإعجاب والنسخ للمنشورات النصية
        if (contentType === 'text') {
            return `
                <button class="post-action-btn like-btn" onclick="reelsManager.toggleLike(${index})">
                    <i class="bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'}"></i>
                    <span>${isLiked ? 'أعجبني' : 'إعجاب'}</span>
                    <span class="like-count">${likeCount > 0 ? `(${likeCount})` : ''}</span>
                </button>
                <button class="post-action-btn like-btn" onclick="reelsManager.toggleComments(${index})">
                    <i class="bi bi-chat"></i>
                    <span>تعليق</span>
                    <span class="comment-count">(${post.commentsCount || 0})</span>
                </button>
                <button class="post-action-btn like-btn" onclick="reelsManager.copyText('${post.text}')">
                    <i class="bi bi-copy"></i>
                    <span>نسخ</span>
                </button>
            `;
        }
        // أزرار الإعجاب والتنزيل للمنشورات المصورة
        else if (contentType === 'image') {
            return `
                <button class="post-action-btn like-btn" onclick="reelsManager.toggleLike(${index})">
                    <i class="bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'}"></i>
                    <span>${isLiked ? 'أعجبني' : 'إعجاب'}</span>
                    <span class="like-count">${likeCount > 0 ? `(${likeCount})` : ''}</span>
                </button>
                <button class="post-action-btn  like-btn" onclick="reelsManager.toggleComments(${index})">
                    <i class="bi bi-chat"></i>
                    <span>تعليق</span>
                    <span class="comment-count">(${post.commentsCount || 0})</span>
                </button>
                <button class="post-action-btn like-btn" onclick="reelsManager.openFullscreen('${post.image}', 'image')">
                    <i class="bi bi-arrows-fullscreen"></i>
                </button>
                <button class="post-action-btn like-btn" onclick="reelsManager.downloadImage('${post.image}', '${post.username || 'مجهول'}')">
                    <i class="bi bi-download"></i>
                    
                </button>
            `;
        }
        // أزرار الإعجاب والتنزيل للمنشورات المرئية
        else if (contentType === 'video') {
            return `
                <button class="post-action-btn like-btn" onclick="reelsManager.toggleLike(${index})">
                    <i class="bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'}"></i>
                    <span>${isLiked ? 'أعجبني' : 'إعجاب'}</span>
                    <span class="like-count">${likeCount > 0 ? `(${likeCount})` : ''}</span>
                </button>
                <button class="post-action-btn  like-btn" onclick="reelsManager.toggleComments(${index})">
                    <i class="bi bi-chat"></i>
                    <span>تعليق</span>
                    <span class="comment-count">(${post.commentsCount || 0})</span>
                </button>
                <button class="post-action-btn like-btn" onclick="reelsManager.openFullscreen('${post.video}', 'video')">
                    <i class="bi bi-arrows-fullscreen"></i>
                </button>
                <button class="post-action-btn like-btn" onclick="reelsManager.downloadVideo('${post.video}', '${post.username || 'مجهول'}')">
                    <i class="bi bi-download"></i>
                </button>
            `;
        }
    }

    playVideo(index) {
        console.log('playVideo called with index:', index);

        // Find the specific post by its data attribute
        const postElement = document.querySelector(`[data-post-index="${index}"]`);
        if (!postElement) {
            console.error('Post element not found for index:', index);
            return;
        }

        const currentVideo = postElement.querySelector('.post-video');
        const currentPlayBtn = postElement.querySelector('.video-play-btn');

        if (!currentVideo) {
            console.error('Video element not found for post:', index);
            return;
        }

        if (!currentPlayBtn) {
            console.error('Play button not found for post:', index);
            return;
        }

        console.log('Found video element:', currentVideo);
        console.log('Video src:', currentVideo.src || currentVideo.querySelector('source')?.src);
        console.log('Video paused state:', currentVideo.paused);

        // Pause all other videos
        const allVideos = document.querySelectorAll('.post-video');
        const allPlayButtons = document.querySelectorAll('.video-play-btn');

        allVideos.forEach((video, i) => {
            if (video !== currentVideo) {
                video.pause();
                video.currentTime = 0;
                if (allPlayButtons[i]) {
                    allPlayButtons[i].style.display = 'flex';
                }
            }
        });

        // Toggle current video
        if (currentVideo.paused) {
            console.log('Attempting to play video...');

            // Ensure video is loaded
            if (currentVideo.readyState < 2) {
                console.log('Video not loaded yet, waiting for canplay event...');
                currentVideo.addEventListener('canplay', () => {
                    currentVideo.play().then(() => {
                        console.log('Video started playing successfully');
                        currentPlayBtn.style.display = 'none';
                    }).catch(error => {
                        console.error('Error playing video after load:', error);
                        currentVideo.controls = true;
                        showError('لا يمكن تشغيل الفيديو. يرجى المحاولة مرة أخرى.');
                    });
                }, { once: true });

                // Load the video
                currentVideo.load();
            } else {
                currentVideo.play().then(() => {
                    console.log('Video started playing successfully');
                    currentPlayBtn.style.display = 'none';
                }).catch(error => {
                    console.error('Error playing video:', error);
                    // If autoplay fails, show controls
                    currentVideo.controls = true;
                    showError('لا يمكن تشغيل الفيديو. يرجى المحاولة مرة أخرى.');
                });
            }
        } else {
            console.log('Pausing video...');
            currentVideo.pause();
            currentPlayBtn.style.display = 'flex';
        }

        // Show play button when video ends
        currentVideo.addEventListener('ended', () => {
            console.log('Video ended, showing play button');
            currentPlayBtn.style.display = 'flex';
        });
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInHours / 24);

        // إذا كان اليوم نفسه
        if (diffInDays === 0) {
            return date.toLocaleTimeString('ar-SA', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }
        // إذا كان أمس
        else if (diffInDays === 1) {
            return 'أمس ' + date.toLocaleTimeString('ar-SA', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }
        // إذا كان قبل ذلك
        else {
            return date.toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }
    }

    async uploadImage() {
        const username = document.getElementById("modalUsername").value || "مجهول";
        const fileInput = document.getElementById("modalImageInput");
        const file = fileInput.files[0];
        const statusDiv = document.getElementById("modalUploadStatus");

        if (!file) {
            showNotification('يرجى اختيار صورة أولاً!', 'warning');

            return;
        }


        // إظهار إشعار "جاري النشر"
        showNotification('جاري النشر...', 'info');

        try {
            // اختبار النظام أولاً
            const isConnected = await reelsManager.testSystemConnection();
            if (!isConnected) {
                throw new Error('فشل في تحميل الإعدادات أو الاتصال بـ GitHub');
            }
            
            const rawUrl = await reelsManager.uploadToGitHub(file);
            const date = new Date().toISOString();

            // Add to Firestore
            const postData = {
                username: username,
                type: 'image',
                image: rawUrl,
                fileName: file.name,
                date: date,
                userId: reelsManager.currentUser ? reelsManager.currentUser.uid : null
            };
            await reelsManager.db.collection("posts").add(postData);



            // إظهار إشعار "تم النشر"
            showNotification('تم النشر بنجاح!', 'success');

            // Clear form
            document.getElementById("modalUsername").value = "";
            document.getElementById("modalImageInput").value = "";

            // Reload posts
            setTimeout(() => {
                reelsManager.loadAndDisplayPosts();
                statusDiv.innerHTML = "";
            }, 2000);

        } catch (err) {

            showNotification('حدث خطأ أثناء النشر: ' + err.message, 'error');
        }
    }

    async uploadVideo() {
        const username = document.getElementById("modalUsername").value || "مجهول";
        const fileInput = document.getElementById("modalVideoInput");
        const file = fileInput.files[0];
        const statusDiv = document.getElementById("modalUploadStatus");

        if (!file) {
            showNotification('يرجى اختيار فيديو أولاً!', 'warning');

            return;
        }


        // إظهار إشعار "جاري النشر"
        showNotification('جاري النشر...', 'info');

        try {
            // اختبار النظام أولاً
            const isConnected = await reelsManager.testSystemConnection();
            if (!isConnected) {
                throw new Error('فشل في تحميل الإعدادات أو الاتصال بـ GitHub');
            }
            
            const rawUrl = await reelsManager.uploadToGitHub(file);
            const date = new Date().toISOString();

            // Add to Firestore
            const postData = {
                username: username,
                type: 'video',
                video: rawUrl,
                fileName: file.name,
                date: date,
                userId: reelsManager.currentUser ? reelsManager.currentUser.uid : null
            };
            await reelsManager.db.collection("posts").add(postData);



            // إظهار إشعار "تم النشر"
            showNotification('تم النشر بنجاح!', 'success');

            // Clear form
            document.getElementById("modalUsername").value = "";
            document.getElementById("modalVideoInput").value = "";

            // Reload posts
            setTimeout(() => {
                reelsManager.loadAndDisplayPosts();
                statusDiv.innerHTML = "";
            }, 2000);

        } catch (err) {
            showNotification('حدث خطأ أثناء النشر: ' + err.message, 'error');
        }
    }

    async uploadContentFromModal() {
        // التحقق من تسجيل الدخول
        if (!this.requireAuth()) {
            return;
        }

        const username = this.currentUser ? this.currentUser.displayName : "مجهول";
        const userId = this.currentUser ? (this.currentUser.uid || this.currentUser.email) : null;
        const statusDiv = document.getElementById("modalUploadStatus");
        const contentType = this.getSelectedContentType();
        const uploadButton = document.querySelector('#uploadModal .btn-primary');

        // منع النقر المتكرر
        if (uploadButton && uploadButton.disabled) {
            return;
        }

        let contentData = null;
        let fileName = '';

        if (contentType === 'text') {
            const textContent = document.getElementById("modalTextContent").value.trim();
            if (!textContent) {
                showNotification('يرجى كتابة نص أولاً!', 'warning');
                return;
            }
            contentData = textContent;
            fileName = `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.txt`;
        } else if (contentType === 'image') {
            const fileInput = document.getElementById("modalImageInput");
            const file = fileInput.files[0];
            if (!file) {
                showNotification('يرجى اختيار صورة أولاً!', 'warning');
                return;
            }
            contentData = file;
            fileName = file.name;
        } else if (contentType === 'video') {
            const fileInput = document.getElementById("modalVideoInput");
            const file = fileInput.files[0];
            if (!file) {
                showNotification('يرجى اختيار فيديو أولاً!', 'warning');
                return;
            }
            contentData = file;
            fileName = file.name;
        }

        // تعطيل الزر وإظهار اللودر
        this.setUploadButtonLoading(true);

        // إظهار إشعار "جاري النشر"
        showNotification('جاري النشر...', 'info');

        try {
            let base64Data;
            let rawUrl;

            if (contentType === 'text') {
                // For text content, convert to base64
                base64Data = btoa(unescape(encodeURIComponent(contentData)));
                rawUrl = `data:text/plain;base64,${base64Data}`;
            } else {
                // For image/video files - upload to GitHub
                console.log('اختبار النظام...');
                const isConnected = await this.testSystemConnection();
                if (!isConnected) {
                    throw new Error('فشل في تحميل الإعدادات أو الاتصال بـ GitHub. تحقق من Firestore والاتصال بالإنترنت.');
                }
                
                console.log('بدء رفع الملف إلى GitHub...');
                rawUrl = await this.uploadToGitHub(contentData);
            }

            const date = new Date().toISOString();

            // Add to Firestore with proper structure
            const postData = {
                username: username,
                userId: userId, // إضافة معرف المستخدم
                type: contentType, // استخدام 'type' بدلاً من 'contentType'
                date: date
            };

            // إضافة الحقول المناسبة حسب نوع المحتوى
            if (contentType === 'text') {
                postData.text = contentData;
            } else if (contentType === 'image') {
                postData.image = rawUrl;
                postData.fileName = fileName;
            } else if (contentType === 'video') {
                postData.video = rawUrl;
                postData.fileName = fileName;
            }

            await this.db.collection("posts").add(postData);


            // إظهار إشعار "تم النشر"
            showNotification('تم النشر بنجاح!', 'success');

            // Clear form
            this.clearModalForm();

            // Close modal and reload content
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('uploadModal'));
                if (modal) modal.hide();
                this.loadAndDisplayPosts();
                statusDiv.innerHTML = "";
            }, 2000);

        } catch (err) {
            console.error('Error uploading content:', err);
            showNotification('حدث خطأ أثناء النشر: ' + err.message, 'error');
        } finally {
            // إعادة تفعيل الزر وإخفاء اللودر
            this.setUploadButtonLoading(false);
        }
    }

    setUploadButtonLoading(isLoading) {
        const uploadButton = document.querySelector('#uploadModal .btn-primary');
        if (!uploadButton) return;

        if (isLoading) {
            uploadButton.disabled = true;
            uploadButton.innerHTML = '<div class="upload-loader-spinner"></div> جاري النشر...';
            uploadButton.style.opacity = '0.7';
            uploadButton.style.cursor = 'not-allowed';
        } else {
            uploadButton.disabled = false;
            uploadButton.innerHTML = 'نشر';
            uploadButton.style.opacity = '1';
            uploadButton.style.cursor = 'pointer';
        }
    }

    downloadVideo(videoUrl, username) {
        try {
            const link = document.createElement('a');
            link.href = videoUrl;
            link.download = `reel_${username}_${Date.now()}.mp4`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading video:', error);
            showError('حدث خطأ أثناء تحميل الفيديو');
        }
    }

    shareVideo(videoUrl) {
        if (navigator.share) {
            navigator.share({
                title: 'ريل إسلامي من Quran Cast',
                url: videoUrl
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(videoUrl).then(() => {
                showNotification('تم نسخ رابط الفيديو إلى الحافظة', 'success');
            }).catch(() => {
                showNotification('رابط الفيديو: ' + videoUrl, 'info');
            });
        }
    }

    downloadImage(imageUrl, username) {
        try {
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = `image_${username}_${Date.now()}.jpg`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading image:', error);
            showError('حدث خطأ أثناء تحميل الصورة');
        }
    }

    shareImage(imageUrl) {
        if (navigator.share) {
            navigator.share({
                title: 'صورة إسلامية من Quran Cast',
                url: imageUrl
            });
        } else {
            navigator.clipboard.writeText(imageUrl).then(() => {
                showNotification('تم نسخ رابط الصورة إلى الحافظة', 'success');
            }).catch(() => {
                showNotification('رابط الصورة: ' + imageUrl, 'info');
            });
        }
    }

    shareText(textContent) {
        if (navigator.share) {
            navigator.share({
                title: 'منشور إسلامي من Quran Cast',
                text: textContent
            });
        } else {
            navigator.clipboard.writeText(textContent).then(() => {
                showNotification('تم نسخ النص إلى الحافظة', 'success');
            }).catch(() => {
                showNotification('النص: ' + textContent, 'info');
            });
        }
    }

    sharePost(content, contentType) {
        if (contentType === 'text') {
            this.shareText(content);
        } else if (contentType === 'image') {
            this.shareImage(content);
        } else if (contentType === 'video') {
            this.shareVideo(content);
        }
    }

    async toggleLike(index) {
        // التحقق من تسجيل الدخول
        if (!this.currentUser) {
            showNotification('يجب تسجيل الدخول أولاً للإعجاب بالمنشورات', 'warning');
            this.openAuthModal();
            return;
        }

        try {
            // الحصول على المنشورات
            const posts = await this.loadPosts();
            const validPosts = posts;

            if (index >= validPosts.length) {
                console.error('Post index out of range:', index);
                return;
            }

            const post = validPosts[index];
            const postId = post.id;
            const currentUserId = this.currentUser.uid || this.currentUser.email || 'local_' + Date.now();
            const currentUserName = this.currentUser.displayName || 'مجهول';

            // الحصول على قائمة الإعجابات الحالية
            const currentLikes = post.likes || [];
            const isLiked = currentLikes.includes(currentUserId);

            let newLikes;
            if (isLiked) {
                // إزالة الإعجاب
                newLikes = currentLikes.filter(userId => userId !== currentUserId);
            } else {
                // إضافة الإعجاب
                newLikes = [...currentLikes, currentUserId];
            }

            // تحديث المنشور في Firestore
            await this.db.collection("posts").doc(postId).update({
                likes: newLikes
            });

            // تحديث الواجهة
            this.updateLikeUI(index, newLikes, currentUserId);

        } catch (error) {
            console.error('Error toggling like:', error);
            showError('حدث خطأ أثناء تحديث الإعجاب');
        }
    }

    updateLikeUI(index, likes, currentUserId) {
        const likeBtn = document.querySelector(`[data-post-index="${index}"] .like-btn`);
        if (!likeBtn) return;

        const icon = likeBtn.querySelector('i');
        const text = likeBtn.querySelector('span');
        const likeCount = document.querySelector(`[data-post-index="${index}"] .like-count`);

        const isLiked = likes.includes(currentUserId);
        const likeCountNumber = likes.length;

        if (isLiked) {
            icon.classList.remove('bi-heart');
            icon.classList.add('bi-heart-fill');
            text.textContent = 'أعجبني';
            likeBtn.style.color = '#e74c3c';
        } else {
            icon.classList.remove('bi-heart-fill');
            icon.classList.add('bi-heart');
            text.textContent = 'إعجاب';
            likeBtn.style.color = '';
        }

        // تحديث عدد الإعجابات
        if (likeCount) {
            likeCount.textContent = likeCountNumber > 0 ? `(${likeCountNumber})` : '';
        }
    }

    updateAllLikesUI(posts) {
        if (!this.currentUser) return;

        // استخدام debounce لمنع الاستدعاءات المتكررة
        this.debounce(() => {
            const currentUserId = this.currentUser.uid || this.currentUser.email || 'local_' + Date.now();

            // تحديث الـ UI للـ likes فقط عند الحاجة
            posts.forEach((post, index) => {
                if (post.likes && post.likes.length > 0) {
                    this.updateLikeUI(index, post.likes, currentUserId);
                }
            });
        }, 300, 'updateLikesUI');
    }

    async deletePost(index) {
        // التحقق من تسجيل الدخول
        if (!this.currentUser) {
            showNotification('يجب تسجيل الدخول أولاً لحذف المنشورات', 'warning');
            this.openAuthModal();
            return;
        }

        try {
            // الحصول على المنشورات
            const posts = await this.loadPosts();
            const validPosts = posts;

            if (index >= validPosts.length) {
                console.error('Post index out of range:', index);
                return;
            }

            const post = validPosts[index];
            const currentUserName = (this.currentUser.displayName || 'مجهول').trim();
            const postUsername = (post.username || '').trim();

            // مقارنة أكثر مرونة للأسماء ومعرف المستخدم
            const currentUserId = this.currentUser.uid || this.currentUser.email;
            const isOwner = postUsername === currentUserName ||
                postUsername === this.currentUser.displayName?.trim() ||
                (this.currentUser.email && postUsername === this.currentUser.email) ||
                (post.userId && post.userId === currentUserId) ||
                (!post.userId && postUsername === currentUserName); // للمنشورات القديمة

            // تسجيل مفصل للتشخيص
            console.log('Post details:', {
                postUsername: post.username,
                postUsernameTrimmed: postUsername,
                currentUserName: currentUserName,
                currentUserDisplayName: this.currentUser.displayName,
                currentUserEmail: this.currentUser.email,
                currentUserId: currentUserId,
                postUserId: post.userId,
                isOwner: isOwner,
                currentUser: this.currentUser,
                comparisonResults: {
                    nameMatch: postUsername === currentUserName,
                    displayNameMatch: postUsername === this.currentUser.displayName?.trim(),
                    emailMatch: this.currentUser.email && postUsername === this.currentUser.email,
                    userIdMatch: post.userId && post.userId === currentUserId,
                    oldPostMatch: !post.userId && postUsername === currentUserName
                }
            });

            if (!isOwner) {
                showError(`لا يمكنك حذف منشورات الآخرين\n\nمنشور: "${post.username}" (${post.userId || 'لا يوجد userId'})\nأنت: "${currentUserName}" (${currentUserId || 'لا يوجد userId'})\n\nإذا كان هذا منشورك، يرجى التأكد من تسجيل الدخول بنفس الحساب`);
                return;
            }

            // تأكيد الحذف
            if (confirm('هل أنت متأكد من حذف هذا المنشور؟\n\n⚠️ تحذير: لا يمكن التراجع عن هذا الإجراء.')) {
                // إظهار loading
                const loadingNotification = showNotification('جاري حذف المنشور...', 'loading', 0, {
                    title: 'حذف المنشور',
                    autoClose: false
                });

                try {
                    await this.db.collection("posts").doc(post.id).delete();

                    // إعادة تحميل المنشورات
                    await this.loadAndDisplayPosts();

                    // إظهار رسالة نجاح
                    hideNotification(loadingNotification);
                    showNotification('تم حذف المنشور بنجاح', 'success', 4000, {
                        title: 'تم الحذف'
                    });
                } catch (deleteError) {
                    console.error('Error deleting post:', deleteError);
                    hideNotification(loadingNotification);
                    showNotification('حدث خطأ أثناء حذف المنشور: ' + deleteError.message, 'error', 6000, {
                        title: 'خطأ في الحذف'
                    });
                }
            }

        } catch (error) {
            console.error('Error deleting post:', error);
            showError('حدث خطأ أثناء حذف المنشور\n\nيرجى المحاولة مرة أخرى أو التحقق من اتصال الإنترنت');
        }
    }

    reportPost(index) {
        // ميزة الإبلاغ (يمكن تطويرها لاحقاً)
        showInfo('شكراً لك على الإبلاغ. سنراجع المنشور قريباً.');
    }

    toggleComments(index) {
        const post = this.posts[index];
        if (!post) return;

        // إنشاء أو إظهار/إخفاء قسم التعليقات
        let commentsSection = document.getElementById(`comments-${index}`);

        if (commentsSection) {
            // إخفاء قسم التعليقات إذا كان موجوداً
            commentsSection.remove();
            return;
        }

        // إنشاء قسم التعليقات كـ popup
        commentsSection = document.createElement('div');
        commentsSection.id = `comments-${index}`;
        commentsSection.className = 'comments-section';
        commentsSection.innerHTML = this.createCommentsHTML(index, post);

        // إضافة event listener لإغلاق الـ popup عند الضغط على الخلفية
        commentsSection.addEventListener('click', (e) => {
            if (e.target === commentsSection) {
                this.toggleComments(index);
            }
        });

        // إضافة event listener لإغلاق الـ popup بمفتاح Escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.toggleComments(index);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        // إدراج قسم التعليقات في body
        document.body.appendChild(commentsSection);

        // إظهار الـ popup
        setTimeout(() => {
            commentsSection.classList.add('active');
        }, 10);

        // تحميل التعليقات
        this.loadComments(index);

        // تهيئة حالة زر الإرسال
        setTimeout(() => {
            this.updateCommentButtonState(index);
        }, 100);
    }

    copyText(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                showNotification('تم نسخ النص إلى الحافظة!', 'success');
            }).catch(() => {
                this.fallbackCopyText(text);
            });
        } else {
            this.fallbackCopyText(text);
        }
    }

    createCommentsHTML(index, post) {
        return `
            <div class="comments-popup">
                <div class="comments-container">
                    <div class="comments-header">
                        <h6>التعليقات</h6>
                        <button class="btn-close-comments" onclick="reelsManager.toggleComments(${index})">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                
                <div class="comments-list" id="comments-list-${index}">
                    <div class="comments-loader" id="comments-loader-${index}">
                        <div class="loader-spinner"></div>
                        <p>جاري تحميل التعليقات...</p>
                    </div>
                </div>
                
                <div class="add-comment">
                    <div class="comment-input-container">
                        <textarea 
                            id="comment-input-${index}" 
                            class="comment-input" 
                            placeholder="اكتب تعليقك هنا..."
                            rows="2"
                            oninput="reelsManager.updateCommentButtonState(${index})"
                        ></textarea>
                        <button 
                            class="btn-send-comment" 
                            onclick="reelsManager.addComment(${index})"
                            disabled
                            style="opacity: 1; transform: scale(1); background: var(--text-muted);"
                        >
                            <i class="bi bi-send"></i>
                        </button>
                    </div>
                </div>
                </div>
            </div>
        `;
    }

    updateCommentButtonState(postIndex) {
        const commentInput = document.getElementById(`comment-input-${postIndex}`);
        const sendButton = document.querySelector(`#comment-input-${postIndex}`).parentElement.querySelector('.btn-send-comment');

        if (commentInput && sendButton) {
            const hasText = commentInput.value.trim().length > 0;
            sendButton.disabled = !hasText;

            // زر الإرسال يبقى مرئياً دائماً مع تغيير اللون فقط
            if (hasText) {
                sendButton.style.opacity = '1';
                sendButton.style.transform = 'scale(1)';
                sendButton.style.background = 'var(--primary-color)';
            } else {
                sendButton.style.opacity = '1';
                sendButton.style.transform = 'scale(1)';
                sendButton.style.background = 'var(--text-muted)';
            }
        }
    }


    fallbackCopyText(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            showNotification('تم نسخ النص إلى الحافظة!', 'success');
        } catch (err) {
            showNotification('فشل في نسخ النص', 'error');
        }

        document.body.removeChild(textArea);
    }

    async addComment(postIndex) {
        const commentInput = document.getElementById(`comment-input-${postIndex}`);
        const sendButton = document.querySelector(`#comment-input-${postIndex}`).parentElement.querySelector('.btn-send-comment');
        const commentText = commentInput.value.trim();

        if (!commentText) {
            showNotification('يرجى كتابة تعليق', 'warning');
            return;
        }

        // التحقق من تسجيل الدخول
        if (!this.currentUser) {
            showNotification('يجب تسجيل الدخول أولاً للتعليق', 'warning');
            this.openAuthModal();
            return;
        }

        // منع النقر المتكرر
        if (sendButton.disabled) {
            return;
        }

        // تعطيل الزر وإظهار اللودر
        this.setCommentButtonLoading(postIndex, true);

        try {
            const comment = {
                id: 'comment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                postIndex: postIndex,
                text: commentText,
                author: this.currentUser.displayName || 'مجهول',
                authorId: this.currentUser.uid,
                timestamp: Date.now(),
                likes: 0,
                likedBy: []
            };

            // حفظ التعليق في Firebase و localStorage
            await this.saveComment(comment);

            // إضافة التعليق للواجهة
            await this.displayComment(comment);

            // تحديث عدد التعليقات
            const comments = await this.getComments();
            const postComments = comments.filter(c => c.postIndex === postIndex);
            this.updateCommentCount(postIndex, postComments.length);

            // تحديث commentsCount في البوست
            if (this.posts[postIndex]) {
                this.posts[postIndex].commentsCount = postComments.length;
            }

            // مسح حقل الإدخال
            commentInput.value = '';
            this.updateCommentButtonState(postIndex);

            showNotification('تم إضافة التعليق بنجاح', 'success');
        } catch (error) {
            console.error('Error adding comment:', error);
            showNotification('حدث خطأ أثناء إضافة التعليق', 'error');
        } finally {
            // إعادة تفعيل الزر وإخفاء اللودر
            this.setCommentButtonLoading(postIndex, false);
        }
    }

    setCommentButtonLoading(postIndex, isLoading) {
        const sendButton = document.querySelector(`#comment-input-${postIndex}`).parentElement.querySelector('.btn-send-comment');
        if (!sendButton) return;

        if (isLoading) {
            sendButton.disabled = true;
            sendButton.innerHTML = '<div class="comment-loader-spinner"></div>';
            sendButton.style.opacity = '0.7';
            sendButton.style.cursor = 'not-allowed';
        } else {
            sendButton.disabled = false;
            sendButton.innerHTML = '<i class="bi bi-send"></i>';
            sendButton.style.opacity = '1';
            sendButton.style.cursor = 'pointer';
        }
    }

    async saveComment(comment) {
        try {
            // حفظ التعليق داخل البوست في Firebase
            if (this.db && this.posts[comment.postIndex]) {
                const post = this.posts[comment.postIndex];
                const postId = post.id || `post_${comment.postIndex}`;

                // إضافة التعليق إلى array التعليقات في البوست
                await this.db.collection('posts').doc(postId).update({
                    comments: firebase.firestore.FieldValue.arrayUnion(comment)
                });
                console.log('Comment saved to post in Firebase:', comment.id);
            }

            // حفظ في localStorage كنسخة احتياطية
            const comments = this.getComments();
            comments.push(comment);
            localStorage.setItem('reels_comments', JSON.stringify(comments));

        } catch (error) {
            console.error('Error saving comment:', error);

            // في حالة فشل Firebase، احفظ في localStorage فقط
            try {
                const comments = this.getComments();
                comments.push(comment);
                localStorage.setItem('reels_comments', JSON.stringify(comments));
                console.log('Comment saved to localStorage as fallback');
            } catch (localError) {
                console.error('Error saving to localStorage:', localError);
            }
        }
    }

    async getComments() {
        try {
            // محاولة تحميل من Firebase أولاً
            if (this.db && this.posts) {
                const allComments = [];

                // تحميل التعليقات من كل بوست
                for (let i = 0; i < this.posts.length; i++) {
                    const post = this.posts[i];
                    const postId = post.id || `post_${i}`;

                    try {
                        const postDoc = await this.db.collection('posts').doc(postId).get();
                        if (postDoc.exists) {
                            const postData = postDoc.data();
                            if (postData.comments && Array.isArray(postData.comments)) {
                                // إضافة postIndex لكل تعليق
                                const postComments = postData.comments.map(comment => ({
                                    ...comment,
                                    postIndex: i
                                }));
                                allComments.push(...postComments);
                            }
                        }
                    } catch (postError) {
                        console.warn(`Error loading comments for post ${i}:`, postError);
                    }
                }

                // ترتيب التعليقات حسب الوقت
                allComments.sort((a, b) => b.timestamp - a.timestamp);

                // حفظ في localStorage للمزامنة
                localStorage.setItem('reels_comments', JSON.stringify(allComments));
                console.log('Comments loaded from Firebase posts:', allComments.length);
                return allComments;
            }
        } catch (error) {
            console.error('Error loading from Firebase:', error);
        }

        // في حالة فشل Firebase، استخدم localStorage
        try {
            const comments = JSON.parse(localStorage.getItem('reels_comments') || '[]');
            console.log('Comments loaded from localStorage:', comments.length);
            return comments;
        } catch (error) {
            console.error('Error loading comments from localStorage:', error);
            return [];
        }
    }

    async loadComments(postIndex) {
        const comments = await this.getComments();
        const postComments = comments.filter(comment => comment.postIndex === postIndex);
        const commentsList = document.getElementById(`comments-list-${postIndex}`);
        const commentsLoader = document.getElementById(`comments-loader-${postIndex}`);

        if (!commentsList) return;

        // إخفاء اللودر
        if (commentsLoader) {
            commentsLoader.style.display = 'none';
        }

        // تحديث عدد التعليقات في الزر
        this.updateCommentCount(postIndex, postComments.length);

        if (postComments.length === 0) {
            commentsList.innerHTML = '<div class="no-comments">لا توجد تعليقات بعد</div>';
            return;
        }

        // ترتيب التعليقات حسب الوقت (الأحدث أولاً)
        postComments.sort((a, b) => b.timestamp - a.timestamp);

        // إنشاء HTML للتعليقات بشكل غير متزامن
        const commentHTMLs = await Promise.all(postComments.map(comment => this.createCommentHTML(comment)));
        commentsList.innerHTML = commentHTMLs.join('');
    }

    updateCommentCount(postIndex, count) {
        try {
            // تحديث عدد التعليقات في جميع أزرار التعليقات لهذا البوست
            const commentButtons = document.querySelectorAll(`[data-post-index="${postIndex}"] .comment-count`);
            commentButtons.forEach(button => {
                if (button) {
                    button.textContent = `(${count})`;
                }
            });
        } catch (error) {
            console.error('Error updating comment count:', error);
        }
    }

    async updateAllCommentCounts() {
        // استخدام debounce لمنع الاستدعاءات المتكررة
        this.debounce(async () => {
            try {
                // تحديث عدد التعليقات لجميع المنشورات
                const comments = await this.getComments();

                if (this.posts && this.posts.length > 0) {
                    // تجميع التعليقات حسب postIndex مرة واحدة
                    const commentCounts = {};
                    comments.forEach(comment => {
                        if (comment.postIndex !== undefined) {
                            commentCounts[comment.postIndex] = (commentCounts[comment.postIndex] || 0) + 1;
                        }
                    });

                    // تحديث الـ UI مرة واحدة
                    Object.keys(commentCounts).forEach(postIndex => {
                        const count = commentCounts[postIndex];
                        this.updateCommentCount(parseInt(postIndex), count);

                        // تحديث commentsCount في البوست نفسه
                        if (this.posts[postIndex]) {
                            this.posts[postIndex].commentsCount = count;
                        }
                    });
                }
            } catch (error) {
                console.error('Error updating comment counts:', error);
            }
        }, 500, 'updateCommentCounts');
    }


    async createCommentHTML(comment) {
        const timeAgo = this.getTimeAgo(comment.timestamp);
        const isLiked = comment.likedBy.includes(this.currentUser?.uid || '');
        const canDelete = this.currentUser && (this.currentUser.uid === comment.authorId);

        // جلب صورة المستخدم
        let userProfilePicture = null;
        if (comment.authorId && this.db) {
            try {
                const userDoc = await this.db.collection('users').doc(comment.authorId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    userProfilePicture = userData.profilePicture;
                }
            } catch (error) {
                console.error('خطأ في جلب صورة المستخدم للتعليق:', error);
            }
        }

        // إنشاء HTML للصورة الشخصية
        const avatarHTML = userProfilePicture
            ? `<img src="${userProfilePicture}" alt="صورة المستخدم" class="comment-avatar-img">`
            : `<img src="${this.createDefaultAvatar(comment.author)}" alt="صورة المستخدم" class="comment-avatar-img">`;

        return `
            <div class="comment-item" data-comment-id="${comment.id}">
                <div class="comment-content">
                    <div class="comment-header">
                        <div class="comment-author-info">
                            <div class="comment-avatar">
                                ${avatarHTML}
                            </div>
                        <span class="comment-author">${comment.author}</span>
                        </div>
                        <div class="comment-header-right">
                        <span class="comment-time">${timeAgo}</span>
                        ${canDelete ? `
                            <button class="btn-delete-comment" onclick="reelsManager.deleteComment('${comment.id}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        ` : ''}
                        </div>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                    <div class="comment-actions">
                        <button class="btn-like-comment ${isLiked ? 'liked' : ''}" 
                                onclick="reelsManager.toggleCommentLike('${comment.id}')">
                            <i class="bi bi-heart${isLiked ? '-fill' : ''}"></i>
                            <span>${comment.likes}</span>
                        </button>
                    </div>
                </div>
                
            </div>
        `;
    }


    async displayComment(comment) {
        const commentsList = document.getElementById(`comments-list-${comment.postIndex}`);
        if (!commentsList) return;

        // إزالة رسالة "لا توجد تعليقات"
        const noComments = commentsList.querySelector('.no-comments');
        if (noComments) {
            noComments.remove();
        }

        // إضافة التعليق الجديد في المقدمة
        const commentHTML = await this.createCommentHTML(comment);
        commentsList.insertAdjacentHTML('afterbegin', commentHTML);
    }

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'الآن';
        if (minutes < 60) return `منذ ${minutes} دقيقة`;
        if (hours < 24) return `منذ ${hours} ساعة`;
        if (days < 7) return `منذ ${days} يوم`;
        return new Date(timestamp).toLocaleDateString('ar-SA');
    }

    // دالة إنشاء الصورة الافتراضية مع أول حرف من الاسم
    createDefaultAvatar(name) {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        
        // الحصول على أول حرف من الاسم
        const firstLetter = name ? name.charAt(0).toUpperCase() : '?';
        
        // استخدام اللون الأساسي للتطبيق
        const backgroundColor = '#17a2b8'; // اللون الأساسي
        
        // رسم الدائرة
        ctx.beginPath();
        ctx.arc(20, 20, 20, 0, 2 * Math.PI);
        ctx.fillStyle = backgroundColor;
        ctx.fill();
        
        // رسم النص
        ctx.fillStyle = 'white';
        ctx.font = 'normal 20px Arial'; // حجم أكبر وبدون bold
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(firstLetter, 20, 20);
        
        return canvas.toDataURL();
    }

    async toggleCommentLike(commentId) {
        if (!this.currentUser) {
            showNotification('يجب تسجيل الدخول أولاً للإعجاب بالتعليقات', 'warning');
            this.openAuthModal();
            return;
        }

        const comments = await this.getComments();
        const comment = comments.find(c => c.id === commentId);

        if (!comment) return;

        const userId = this.currentUser.uid;
        const isLiked = comment.likedBy.includes(userId);

        if (isLiked) {
            comment.likedBy = comment.likedBy.filter(id => id !== userId);
            comment.likes--;
        } else {
            comment.likedBy.push(userId);
            comment.likes++;
        }

        try {
            // حفظ التغييرات في Firebase
            if (this.db) {
                await this.db.collection('comments').doc(commentId).update({
                    likes: comment.likes,
                    likedBy: comment.likedBy
                });
                console.log('Comment like updated in Firebase:', commentId);
            }

            // حفظ التغييرات في localStorage
            localStorage.setItem('reels_comments', JSON.stringify(comments));

            // تحديث الواجهة
            this.updateCommentLikes(commentId, comment.likes, !isLiked);
        } catch (error) {
            console.error('Error updating comment like:', error);
            showError('حدث خطأ في تحديث الإعجاب');
        }
    }

    updateCommentLikes(commentId, likes, isLiked) {
        const likeButton = document.querySelector(`[data-comment-id="${commentId}"] .btn-like-comment`);
        if (likeButton) {
            likeButton.classList.toggle('liked', isLiked);
            likeButton.querySelector('span').textContent = likes;
            likeButton.querySelector('i').className = `bi bi-heart${isLiked ? '-fill' : ''}`;
        }
    }

    async deleteComment(commentId) {
        if (!this.currentUser) return;

        const comments = await this.getComments();
        const comment = comments.find(c => c.id === commentId);

        if (!comment || comment.authorId !== this.currentUser.uid) {
            showError('لا يمكنك حذف هذا التعليق');
            return;
        }

        if (confirm('هل أنت متأكد من حذف هذا التعليق؟')) {
            try {
                // حذف من Firebase (من داخل البوست)
                if (this.db && this.posts[comment.postIndex]) {
                    const post = this.posts[comment.postIndex];
                    const postId = post.id || `post_${comment.postIndex}`;

                    // إزالة التعليق من array التعليقات في البوست
                    await this.db.collection('posts').doc(postId).update({
                        comments: firebase.firestore.FieldValue.arrayRemove(comment)
                    });
                    console.log('Comment deleted from post in Firebase:', commentId);
                }

                // حذف من localStorage
                const updatedComments = comments.filter(c => c.id !== commentId);
                localStorage.setItem('reels_comments', JSON.stringify(updatedComments));

                // إزالة التعليق من الواجهة
                const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
                if (commentElement) {
                    commentElement.remove();
                }

                // تحديث عدد التعليقات
                const allComments = await this.getComments();
                const postComments = allComments.filter(c => c.postIndex === comment.postIndex);
                this.updateCommentCount(comment.postIndex, postComments.length);

                // تحديث commentsCount في البوست
                if (this.posts[comment.postIndex]) {
                    this.posts[comment.postIndex].commentsCount = postComments.length;
                }

                showNotification('تم حذف التعليق', 'success');
            } catch (error) {
                console.error('Error deleting comment:', error);
                showNotification('حدث خطأ في حذف التعليق', 'error');
            }
        }
    }






    openFullscreen(url, type) {
        const modal = document.createElement('div');
        modal.className = 'fullscreen-modal unified-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        `;

        const content = document.createElement('div');
        content.className = 'modal-content';
        content.style.cssText = `
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border: 2px solid #17a2b8;
            border-radius: 25px;
            max-width: 90%;
            max-height: 90%;
            position: relative;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        `;

        // إضافة الخط العلوي
        const topLine = document.createElement('div');
        topLine.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 5px;
            background: linear-gradient(135deg, #17a2b8 0%, #0f766e 100%);
            z-index: 1;
        `;
        content.appendChild(topLine);

        if (type === 'image') {
            const img = document.createElement('img');
            img.src = url;
            img.style.cssText = `
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
            `;
            content.appendChild(img);
        } else if (type === 'video') {
            const video = document.createElement('video');
            video.src = url;
            video.controls = true;
            video.autoplay = true;
            video.style.cssText = `
                max-width: 100%;
                max-height: 100%;
            `;
            content.appendChild(video);
        }

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.className = 'btn-close';
        closeBtn.style.cssText = `
            position: absolute;
            right: 1rem;
            top: 1rem;
            z-index: 10;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            width: 2.5rem;
            height: 2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            color: white;
            font-size: 1.2rem;
            transition: all 0.3s ease;
            cursor: pointer;
        `;

        content.appendChild(closeBtn);
        modal.appendChild(content);
        document.body.appendChild(modal);

        // إغلاق عند الضغط على الخلفية أو زر الإغلاق
        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        };

        closeBtn.onclick = () => {
            document.body.removeChild(modal);
        };

        // إغلاق بمفتاح ESC
        const handleKeyPress = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', handleKeyPress);
            }
        };
        document.addEventListener('keydown', handleKeyPress);
    }

    getSelectedContentType() {
        const activeOption = document.querySelector('.content-type-option.active');
        return activeOption ? activeOption.dataset.type : 'text';
    }

    clearModalForm() {
        document.getElementById("modalUsername").value = "";
        document.getElementById("modalTextContent").value = "";
        document.getElementById("modalImageInput").value = "";
        document.getElementById("modalVideoInput").value = "";

        // Reset content type selection
        document.querySelectorAll('.content-type-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector('.content-type-option[data-type="text"]').classList.add('active');

        // Hide all content sections
        document.getElementById('textContent').style.display = 'block';
        document.getElementById('imageContent').style.display = 'none';
        document.getElementById('videoContent').style.display = 'none';
    }

    async migrateOldData() {
        // تم تعطيل هذه الوظيفة لأنها تحذف جميع المنشورات!
        // هذه الوظيفة كانت مخصصة لمرة واحدة فقط لتنظيف البيانات القديمة
        console.log('migrateOldData disabled - data preservation enabled');
        return;

        /* 
        // الكود القديم المحذوف:
        try {
            const oldPostsSnapshot = await this.db.collection('posts').get();
            const oldPosts = oldPostsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            for (const post of oldPosts) {
                await this.db.collection('posts').doc(post.id).delete();
            }
            console.log('تم مسح البيانات القديمة بنجاح');
        } catch (error) {
            console.error('Error migrating data:', error);
        }
        */
    }

    // تحميل إعدادات GitHub من Firestore
    async loadGitHubSettings() {
        try {
            console.log('تحميل إعدادات GitHub من Firestore...');
            
            const settingsDoc = await this.db.collection('admin_settings').doc('github').get();
            
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();
                
                // تحديث الإعدادات
                AppConfig.github.token = settings.token;
                AppConfig.github.repository = settings.repo.replace('https://github.com/', '');
                AppConfig.github.branch = settings.branch || 'main';
                AppConfig.isLoaded = true;
                
                console.log('✅ تم تحميل إعدادات GitHub بنجاح');
                console.log('المستودع:', AppConfig.github.repository);
                console.log('الفرع:', AppConfig.github.branch);
                console.log('الـ token:', AppConfig.github.token ? 'موجود' : 'غير موجود');
                
                return true;
            } else {
                console.error('❌ لم يتم العثور على إعدادات GitHub في Firestore');
                console.error('🔧 تأكد من وجود المستند في admin_settings/github');
                return false;
            }
        } catch (error) {
            console.error('❌ خطأ في تحميل إعدادات GitHub:', error);
            return false;
        }
    }

    // اختبار شامل للنظام (Firestore + GitHub)
    async testSystemConnection() {
        console.log('🔍 بدء اختبار شامل للنظام...');
        
        // اختبار Firestore
        console.log('1. اختبار اتصال Firestore...');
        const firestoreTest = await this.loadGitHubSettings();
        if (!firestoreTest) {
            console.error('❌ فشل في تحميل الإعدادات من Firestore');
            return false;
        }
        console.log('✅ تم تحميل الإعدادات من Firestore بنجاح');
        
        // اختبار GitHub
        console.log('2. اختبار اتصال GitHub...');
        const githubTest = await this.testGitHubConnection();
        if (!githubTest) {
            console.error('❌ فشل في الاتصال بـ GitHub');
            return false;
        }
        console.log('✅ تم الاتصال بـ GitHub بنجاح');
        
        console.log('🎉 جميع الاختبارات نجحت! النظام جاهز للاستخدام');
        return true;
    }

    // اختبار صحة GitHub token
    async testGitHubConnection() {
        // تحميل الإعدادات أولاً إذا لم تكن محملة
        if (!AppConfig.isLoaded) {
            const loaded = await this.loadGitHubSettings();
            if (!loaded) {
                return false;
            }
        }
        
        const repo = AppConfig.github.repository;
        const token = AppConfig.github.token;
        const url = `https://api.github.com/repos/${repo}`;
        
        // التحقق من وجود الـ token
        if (!token) {
            console.error('❌ لم يتم تكوين GitHub token');
            console.error('🔧 يرجى تحديث الـ token في Firestore');
            
            // إظهار إشعار للمستخدم
            if (typeof showNotification === 'function') {
                showNotification('لم يتم تكوين GitHub token. يرجى تحديث الإعدادات في Firestore.', 'error');
            }
            
            return false;
        }
        
        try {
            console.log('اختبار الاتصال بـ GitHub...');
            console.log('المستودع:', repo);
            console.log('الـ token:', token.substring(0, 20) + '...');
            
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/vnd.github.v3+json"
                }
            });
            
            console.log('استجابة GitHub:', response.status, response.statusText);
            
            if (response.ok) {
                const data = await response.json();
                console.log('GitHub connection successful');
                console.log('معلومات المستودع:', data.name, data.full_name);
                return true;
            } else {
                const error = await response.json();
                console.error('GitHub connection failed:', error);
                
                // رسائل خطأ محددة
                if (response.status === 401) {
                    console.error('❌ خطأ في المصادقة: الـ token غير صالح أو منتهي الصلاحية');
                    console.error('🔧 الحل: أنشئ token جديد من GitHub Settings');
                } else if (response.status === 404) {
                    console.error('❌ المستودع غير موجود: ' + repo);
                    console.error('🔧 الحل: تأكد من وجود المستودع أو أنشئه');
                } else if (response.status === 403) {
                    console.error('❌ تم رفض الطلب: لا توجد صلاحيات كافية');
                    console.error('🔧 الحل: تأكد من صلاحيات الـ token');
                }
                
                return false;
            }
        } catch (error) {
            console.error('GitHub connection error:', error);
            console.error('❌ خطأ في الاتصال: تحقق من اتصال الإنترنت');
            return false;
        }
    }

    async uploadToGitHub(file) {
        return new Promise(async (resolve, reject) => {
            // تحميل الإعدادات أولاً إذا لم تكن محملة
            if (!AppConfig.isLoaded) {
                const loaded = await this.loadGitHubSettings();
                if (!loaded) {
                    reject(new Error('فشل في تحميل إعدادات GitHub من Firestore'));
                    return;
                }
            }
            
            const reader = new FileReader();
            reader.onload = async function () {
                try {
                    const base64Data = reader.result.split(',')[1];
                    
                    // إنشاء اسم ملف فريد لتجنب التضارب
                    const timestamp = Date.now();
                    const randomString = Math.random().toString(36).substr(2, 9);
                    const fileExtension = file.name.split('.').pop();
                    const path = `uploads/${timestamp}_${randomString}.${fileExtension}`;
                    
                    const repo = AppConfig.github.repository;
                    const token = AppConfig.github.token;
                    const branch = AppConfig.github.branch;
                    const url = `https://api.github.com/repos/${repo}/contents/${path}`;
                    const message = `Add ${file.name} - ${new Date().toISOString()}`;

                    console.log('رفع الملف إلى GitHub:', file.name, 'الحجم:', file.size, 'bytes');

                    // أولاً، تحقق من وجود الملف
                    let sha = null;
                    try {
                        const checkResponse = await fetch(url, {
                            method: "GET",
                            headers: {
                                "Authorization": `Bearer ${token}`,
                                "Accept": "application/vnd.github.v3+json"
                            }
                        });

                        if (checkResponse.ok) {
                            const fileData = await checkResponse.json();
                            sha = fileData.sha;
                            console.log('الملف موجود بالفعل، سيتم تحديثه');
                        }
                    } catch (e) {
                        console.log('الملف غير موجود، سيتم إنشاؤه');
                    }

                    const body = {
                        message: message,
                        content: base64Data,
                        branch: branch
                    };

                    // إضافة SHA إذا كان الملف موجود
                    if (sha) {
                        body.sha = sha;
                    }

                    console.log('إرسال طلب رفع إلى GitHub...');
                    const response = await fetch(url, {
                        method: "PUT",
                        headers: {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json",
                            "Accept": "application/vnd.github.v3+json"
                        },
                        body: JSON.stringify(body)
                    });

                    console.log('استجابة GitHub:', response.status, response.statusText);

                    if (!response.ok) {
                        const error = await response.json();
                        console.error('خطأ GitHub API:', error);
                        
                        // معالجة أخطاء محددة
                        if (response.status === 401) {
                            throw new Error('خطأ في المصادقة: تحقق من صحة GitHub token');
                        } else if (response.status === 403) {
                            throw new Error('تم رفض الطلب: تحقق من صلاحيات المستودع');
                        } else if (response.status === 422) {
                            throw new Error('خطأ في البيانات المرسلة: ' + (error.message || 'غير معروف'));
                        } else {
                            throw new Error(`GitHub API Error (${response.status}): ${error.message || JSON.stringify(error)}`);
                        }
                    }

                    const result = await response.json();
                    console.log('تم رفع الملف بنجاح:', result.content.html_url);
                    
                    const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;
                    resolve(rawUrl);
                } catch (error) {
                    console.error('خطأ في رفع الملف:', error);
                    reject(error);
                }
            };
            reader.onerror = (error) => {
                console.error('خطأ في قراءة الملف:', error);
                reject(new Error('فشل في قراءة الملف'));
            };
            reader.readAsDataURL(file);
        });
    }

    setupContentTypeSelector() {
        const options = document.querySelectorAll('.content-type-option');
        const textContent = document.getElementById('textContent');
        const imageContent = document.getElementById('imageContent');
        const videoContent = document.getElementById('videoContent');

        options.forEach(option => {
            option.addEventListener('click', () => {
                // Remove active class from all options
                options.forEach(opt => opt.classList.remove('active'));
                // Add active class to clicked option
                option.classList.add('active');

                // Hide all content sections
                textContent.style.display = 'none';
                imageContent.style.display = 'none';
                videoContent.style.display = 'none';

                // Show selected content section
                const contentType = option.dataset.type;
                if (contentType === 'text') {
                    textContent.style.display = 'block';
                } else if (contentType === 'image') {
                    imageContent.style.display = 'block';
                } else if (contentType === 'video') {
                    videoContent.style.display = 'block';
                }
            });
        });

        // Set default to text
        options[0].classList.add('active');
    }

    // Authentication methods
    async loginWithEmail() {
        try {
            await this.ensureFirebaseInitialized();

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            if (!email || !password) {
                showNotification('يرجى ملء جميع الحقول', 'warning');
                return;
            }

            const result = await this.auth.signInWithEmailAndPassword(email, password);
            this.currentUser = result.user;
            this.updateUIAfterLogin();
            this.hideAuthModal();
            this.closeSidebar();
            showNotification('تم تسجيل الدخول بنجاح!', 'success');
            console.log('تم تسجيل الدخول بالإيميل:', this.currentUser.displayName);

        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
            let errorMessage = '';

            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage += 'البريد الإلكتروني غير مسجل';
                    break;
                case 'auth/wrong-password':
                    errorMessage += 'كلمة المرور غير صحيحة';
                    break;
                case 'auth/invalid-email':
                    errorMessage += 'البريد الإلكتروني غير صحيح';
                    break;
                case 'auth/user-disabled':
                    errorMessage += 'تم تعطيل هذا الحساب';
                    break;
                default:
                    errorMessage += error.message;
            }


            showNotification(errorMessage, 'error');
        }
    }

    async signupWithEmail() {
        try {
            await this.ensureFirebaseInitialized();

            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const profilePictureFile = document.getElementById('profilePicture').files[0];

            if (!name || !email || !password || !confirmPassword) {
                showNotification('يرجى ملء جميع الحقول', 'warning');
                return;
            }

            if (password !== confirmPassword) {
                showNotification('كلمة المرور غير متطابقة', 'error');
                return;
            }

            if (password.length < 6) {
                showNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
                return;
            }

            const result = await this.auth.createUserWithEmailAndPassword(email, password);

            // رفع الصورة الشخصية إذا تم اختيارها
            let profilePictureUrl = null;
            if (profilePictureFile) {
                try {
                    showNotification('جاري رفع الصورة الشخصية...', 'info');
                    
                    // اختبار النظام أولاً
                    const isConnected = await this.testSystemConnection();
                    if (!isConnected) {
                        throw new Error('فشل في تحميل الإعدادات أو الاتصال بـ GitHub');
                    }
                    
                    profilePictureUrl = await this.uploadToGitHub(profilePictureFile);
                    console.log('تم رفع الصورة الشخصية:', profilePictureUrl);
                } catch (uploadError) {
                    console.error('خطأ في رفع الصورة الشخصية:', uploadError);
                    showNotification('تم إنشاء الحساب ولكن فشل في رفع الصورة الشخصية', 'warning');
                }
            }

            // تحديث اسم المستخدم
            await result.user.updateProfile({
                displayName: name
            });

            // حفظ معلومات المستخدم في Firestore مع الصورة الشخصية
            if (this.db) {
                try {
                    await this.db.collection('users').doc(result.user.uid).set({
                        displayName: name,
                        email: email,
                        profilePicture: profilePictureUrl,
                        createdAt: new Date().toISOString()
                    });
                    console.log('تم حفظ معلومات المستخدم في Firestore');
                } catch (firestoreError) {
                    console.error('خطأ في حفظ معلومات المستخدم:', firestoreError);
                }
            }

            this.currentUser = result.user;
            this.updateUIAfterLogin();
            this.hideAuthModal();
            this.closeSidebar();
            showNotification('تم إنشاء الحساب بنجاح!', 'success');
            console.log('تم إنشاء الحساب:', this.currentUser.displayName);

        } catch (error) {
            console.error('خطأ في إنشاء الحساب:', error);
            let errorMessage = '';

            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage += 'البريد الإلكتروني مستخدم بالفعل';
                    break;
                case 'auth/invalid-email':
                    errorMessage += 'البريد الإلكتروني غير صحيح';
                    break;
                case 'auth/weak-password':
                    errorMessage += 'كلمة المرور ضعيفة جداً';
                    break;
                default:
                    errorMessage += error.message;
            }

            showNotification(errorMessage, 'error');
        }
    }

    async signupWithGoogle() {
        try {
            // التأكد من تهيئة Firebase أولاً
            await this.ensureFirebaseInitialized();

            // إظهار رسالة التحميل
            showNotification('جاري إنشاء الحساب بجوجل...', 'info');

            // إنشاء Google Auth Provider
            const provider = new firebase.auth.GoogleAuthProvider();
            
            // إضافة نطاقات إضافية للحصول على معلومات أكثر
            provider.addScope('email');
            provider.addScope('profile');

            // تسجيل الدخول/التسجيل باستخدام popup
            const result = await this.auth.signInWithPopup(provider);
            
            // الحصول على معلومات المستخدم
            const user = result.user;
            const credential = result.credential;

            console.log('تم إنشاء/تسجيل الدخول بجوجل بنجاح:', user);

            // حفظ معلومات المستخدم في Firestore
            if (this.db) {
                try {
                    await this.db.collection('users').doc(user.uid).set({
                        displayName: user.displayName,
                        email: user.email,
                        profilePicture: user.photoURL,
                        provider: 'google',
                        createdAt: new Date().toISOString(),
                        lastLogin: new Date().toISOString()
                    }, { merge: true });
                    console.log('تم حفظ معلومات المستخدم في Firestore');
                } catch (firestoreError) {
                    console.error('خطأ في حفظ معلومات المستخدم:', firestoreError);
                }
            }

            // حفظ معلومات المستخدم
            this.currentUser = {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                provider: 'google'
            };

            // حفظ في localStorage
            localStorage.setItem('userLoggedIn', 'true');
            localStorage.setItem('userDisplayName', user.displayName);
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('userPhotoURL', user.photoURL || '');
            localStorage.setItem('userProvider', 'google');

            // تحديث الواجهة
            this.updateUIAfterLogin();

            // إغلاق المودال
            this.hideAuthModal();

            // رسالة نجاح
            showNotification(`مرحباً ${user.displayName}! تم إنشاء/تسجيل الدخول بنجاح`, 'success');

            return true;

        } catch (error) {
            console.error('خطأ في إنشاء/تسجيل الدخول بجوجل:', error);
            
            let errorMessage = 'حدث خطأ في إنشاء/تسجيل الدخول بجوجل';
            
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'تم إلغاء العملية';
            } else if (error.code === 'auth/popup-blocked') {
                errorMessage = 'تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'خطأ في الشبكة. يرجى التحقق من اتصال الإنترنت';
            } else if (error.code === 'auth/account-exists-with-different-credential') {
                errorMessage = 'يوجد حساب بنفس البريد الإلكتروني مع طريقة تسجيل دخول مختلفة';
            }

            showNotification(errorMessage, 'error');
            return false;
        }
    }

    async loginWithGoogle() {
        try {
            // التأكد من تهيئة Firebase أولاً
            await this.ensureFirebaseInitialized();

            // إظهار رسالة التحميل
            showNotification('جاري تسجيل الدخول بجوجل...', 'info');

            // إنشاء Google Auth Provider
            const provider = new firebase.auth.GoogleAuthProvider();
            
            // إضافة نطاقات إضافية للحصول على معلومات أكثر
            provider.addScope('email');
            provider.addScope('profile');

            // تسجيل الدخول باستخدام popup
            const result = await this.auth.signInWithPopup(provider);
            
            // الحصول على معلومات المستخدم
            const user = result.user;
            const credential = result.credential;

            console.log('تم تسجيل الدخول بجوجل بنجاح:', user);

            // حفظ معلومات المستخدم في Firestore
            if (this.db) {
                try {
                    await this.db.collection('users').doc(user.uid).set({
                        displayName: user.displayName,
                        email: user.email,
                        profilePicture: user.photoURL,
                        provider: 'google',
                        lastLogin: new Date().toISOString()
                    }, { merge: true });
                    console.log('تم حفظ معلومات المستخدم في Firestore');
                } catch (firestoreError) {
                    console.error('خطأ في حفظ معلومات المستخدم:', firestoreError);
                }
            }

            // حفظ معلومات المستخدم
            this.currentUser = {
                uid: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                provider: 'google'
            };

            // حفظ في localStorage
            localStorage.setItem('userLoggedIn', 'true');
            localStorage.setItem('userDisplayName', user.displayName);
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('userPhotoURL', user.photoURL || '');
            localStorage.setItem('userProvider', 'google');

            // تحديث الواجهة
            this.updateUIAfterLogin();

            // إغلاق المودال
            this.hideAuthModal();

            // رسالة نجاح
            showNotification(`مرحباً ${user.displayName}! تم تسجيل الدخول بنجاح`, 'success');

            return true;

        } catch (error) {
            console.error('خطأ في تسجيل الدخول بجوجل:', error);
            
            let errorMessage = 'حدث خطأ في تسجيل الدخول بجوجل';
            
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'تم إلغاء تسجيل الدخول';
            } else if (error.code === 'auth/popup-blocked') {
                errorMessage = 'تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'خطأ في الشبكة. يرجى التحقق من اتصال الإنترنت';
            } else if (error.code === 'auth/account-exists-with-different-credential') {
                errorMessage = 'يوجد حساب بنفس البريد الإلكتروني مع طريقة تسجيل دخول مختلفة';
            }

            showNotification(errorMessage, 'error');
            return false;
        }
    }

    async logout() {
        try {
            // تسجيل الخروج من Firebase
            if (this.auth) {
                await this.auth.signOut();
            }

            // مسح بيانات المستخدم
            this.currentUser = null;

            // مسح localStorage
            localStorage.removeItem('userLoggedIn');
            localStorage.removeItem('userDisplayName');
            localStorage.removeItem('userEmail');

            // تحديث الواجهة
            this.updateUIAfterLogout();

            // إغلاق السايد بار
            this.closeSidebar();

            console.log('تم تسجيل الخروج بنجاح');

            // رسالة نجاح
            showNotification('تم تسجيل الخروج بنجاح!', 'success');

        } catch (error) {
            console.error('خطأ في تسجيل الخروج:', error);
            showError('حدث خطأ في تسجيل الخروج: ' + error.message);
        }
    }

    updateUIAfterLogin() {
        // إخفاء زر تسجيل الدخول وإظهار معلومات المستخدم
        const loginBtn = document.getElementById('loginBtn');
        const userDropdown = document.getElementById('userDropdown');
        const mobileLoginBtn = document.getElementById('mobileLoginBtn');
        const mobileUserBtn = document.getElementById('mobileUserBtn');
        const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
        const userName = document.getElementById('userName');
        const mobileUserName = document.getElementById('mobileUserName');
        const firebaseHelpBtn = document.getElementById('firebaseHelpBtn');

        if (loginBtn) loginBtn.style.display = 'none';
        if (userDropdown) userDropdown.style.display = 'block';
        if (mobileLoginBtn) mobileLoginBtn.style.display = 'none';
        if (mobileUserBtn) mobileUserBtn.style.display = 'flex';
        if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'flex';
        if (firebaseHelpBtn) firebaseHelpBtn.style.display = 'none';

        // إظهار زر الرفع عند تسجيل الدخول
        const floatingUploadBtn = document.getElementById('floatingUploadBtn');
        if (floatingUploadBtn) floatingUploadBtn.style.display = 'block';

        // تحديث صفحة البوستات إذا كانت مفتوحة
        if (window.location.hash === '#reels') {
            this.loadAndDisplayPosts();
        }

        if (this.currentUser) {
            const displayName = this.currentUser.displayName || 'المستخدم';
            if (userName) userName.textContent = displayName;
            if (mobileUserName) mobileUserName.textContent = displayName;

            // حفظ حالة تسجيل الدخول في localStorage
            localStorage.setItem('userLoggedIn', 'true');
            localStorage.setItem('userDisplayName', displayName);
            localStorage.setItem('userEmail', this.currentUser.email || '');
        }
    }

    updateUIAfterLogout() {
        // إظهار زر تسجيل الدخول وإخفاء معلومات المستخدم
        const loginBtn = document.getElementById('loginBtn');
        const userDropdown = document.getElementById('userDropdown');
        const mobileLoginBtn = document.getElementById('mobileLoginBtn');
        const mobileUserBtn = document.getElementById('mobileUserBtn');
        const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
        const firebaseHelpBtn = document.getElementById('firebaseHelpBtn');

        // إظهار أزرار تسجيل الدخول
        if (loginBtn) {
            loginBtn.style.display = 'inline-block';
            loginBtn.style.visibility = 'visible';
        }
        if (mobileLoginBtn) {
            mobileLoginBtn.style.display = 'flex';
            mobileLoginBtn.style.visibility = 'visible';
        }

        // إخفاء معلومات المستخدم
        if (userDropdown) userDropdown.style.display = 'none';
        if (mobileUserBtn) mobileUserBtn.style.display = 'none';
        if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'none';

        // إظهار زر إعداد Firebase
        if (firebaseHelpBtn) firebaseHelpBtn.style.display = 'inline-block';

        // إخفاء زر الرفع
        const floatingUploadBtn = document.getElementById('floatingUploadBtn');
        if (floatingUploadBtn) floatingUploadBtn.style.display = 'none';

        // تحديث صفحة البوستات إذا كانت مفتوحة
        if (window.location.hash === '#reels') {
            this.loadAndDisplayPosts();
        }

        console.log('تم تحديث الواجهة بعد تسجيل الخروج');
    }

    checkAuthState() {
        return new Promise((resolve) => {
            if (this.auth) {
                this.auth.onAuthStateChanged((user) => {
                    if (user) {
                        this.currentUser = user;
                        this.updateUIAfterLogin();
                        console.log('User is signed in:', user.displayName);
                    } else {
                        this.currentUser = null;
                        this.updateUIAfterLogout();
                        console.log('User is signed out');
                    }

                    // تحديث صفحة البوستات إذا كانت مفتوحة
                    if (window.location.hash === '#reels') {
                        this.loadAndDisplayPosts();
                    }
                    resolve();
                });
            } else {
                // فحص localStorage كنسخة احتياطية
                this.checkLocalStorageAuth();
                resolve();
            }
        });
    }

    checkLocalStorageAuth() {
        const isLoggedIn = localStorage.getItem('userLoggedIn');
        const displayName = localStorage.getItem('userDisplayName');

        if (isLoggedIn === 'true' && displayName) {
            // إنشاء مستخدم وهمي من localStorage
            this.currentUser = {
                displayName: displayName,
                email: localStorage.getItem('userEmail') || '',
                uid: 'local_' + Date.now()
            };
            this.updateUIAfterLogin();
            console.log('User restored from localStorage:', displayName);
        } else {
            this.currentUser = null;
            this.updateUIAfterLogout();
        }

        // تحديث صفحة البوستات إذا كانت مفتوحة
        if (window.location.hash === '#reels') {
            this.loadAndDisplayPosts();
        }
    }

    requireAuth() {
        if (!this.currentUser) {
            showNotification('يجب تسجيل الدخول أولاً لنشر المحتوى', 'warning');
            this.openAuthModal();
            return false;
        }
        return true;
    }


    // فحص حالة redirect بعد العودة
    async checkRedirectResult() {
        try {
            if (this.auth) {
                const result = await this.auth.getRedirectResult();
                if (result.user) {
                    this.currentUser = result.user;
                    this.updateUIAfterLogin();
                    console.log('تم تسجيل الدخول بالـ redirect:', this.currentUser.displayName);
                }
            }
        } catch (error) {
            console.error('خطأ في فحص redirect:', error);
        }
    }

    // دالة مساعدة لضمان أعلى z-index للـ modals
    ensureModalZIndex(modalElement) {
        if (modalElement) {
            modalElement.style.zIndex = '9999';
            const modalDialog = modalElement.querySelector('.modal-dialog');
            if (modalDialog) {
                modalDialog.style.zIndex = '10000';
            }
            const modalContent = modalElement.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.zIndex = '10001';
            }

            // إخفاء زر الرفع عند فتح الـ modal
            hideFloatingUploadBtn();

            // إضافة class للـ body عند فتح الـ modal
            document.body.classList.add('modal-open');
        }
    }

    // وظائف مساعدة للـ modal
    openAuthModal() {
        // إغلاق جميع الـ popups المفتوحة أولاً
        this.closeAllPopups();

        const authModal = document.getElementById('authModal');
        this.ensureModalZIndex(authModal);

        const modal = new bootstrap.Modal(authModal);
        modal.show();
        this.setupAuthModal();

        // إظهار زر الرفع عند إغلاق الـ modal
        authModal.addEventListener('hidden.bs.modal', () => {
            document.body.classList.remove('modal-open');
            showFloatingUploadBtn();
        });

        // إغلاق السايد بار إذا كان مفتوحاً
        this.closeSidebar();
    }

    // إغلاق جميع الـ popups المفتوحة
    closeAllPopups() {
        // إغلاق popup التعليقات
        const commentsSections = document.querySelectorAll('.comments-section');
        commentsSections.forEach(section => {
            section.remove();
        });

        // إغلاق popup الرفع
        const uploadModal = bootstrap.Modal.getInstance(document.getElementById('uploadModal'));
        if (uploadModal) {
            uploadModal.hide();
        }

        // إغلاق popup المصادقة
        const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
        if (authModal) {
            authModal.hide();
        }

        // إغلاق popup الـ fullscreen
        const fullscreenModals = document.querySelectorAll('.fullscreen-modal');
        fullscreenModals.forEach(modal => {
            modal.remove();
        });

        // إعادة تفعيل التمرير
        document.body.style.overflow = '';
    }

    hideAuthModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
        if (modal) {
            modal.hide();
        }
    }

    setupAuthModal() {
        // إعداد تبديل بين تسجيل الدخول وإنشاء الحساب
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const authModalLabel = document.getElementById('authModalLabel');

        if (loginForm && signupForm && authModalLabel) {
            // إظهار نموذج تسجيل الدخول افتراضياً
            loginForm.style.display = 'block';
            signupForm.style.display = 'none';
            authModalLabel.textContent = 'تسجيل الدخول';
        }
    }

    switchToSignup() {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const authModalLabel = document.getElementById('authModalLabel');

        if (loginForm && signupForm && authModalLabel) {
            loginForm.style.display = 'none';
            signupForm.style.display = 'block';
            authModalLabel.textContent = 'إنشاء حساب';
        }
    }

    switchToLogin() {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const authModalLabel = document.getElementById('authModalLabel');

        if (loginForm && signupForm && authModalLabel) {
            loginForm.style.display = 'block';
            signupForm.style.display = 'none';
            authModalLabel.textContent = 'تسجيل الدخول';
        }
    }



    closeSidebar() {
        // إغلاق السايد بار إذا كان مفتوحاً
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        if (sidebar && overlay) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        }
    }

    showLogoutSuccess() {
        // إنشاء toast notification
     
    }

    // Loading animation functions
    showLoadingAnimation(container) {
        container.innerHTML = `
            <div class="reels-loading">
                
                <div class="loading-text">
                    <h5 class="mt-3">جاري تحميل المنشورات...</h5>
                   
                </div>
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
    }

    hideLoadingAnimation() {
        // Animation will be handled by displayPostsWithAnimation
    }

    async displayPostsWithAnimation(container, posts) {
        // Clear container
        container.innerHTML = '';

        // Add posts with optimized animation
        for (let index = 0; index < posts.length; index++) {
            const post = posts[index];
            const postElement = document.createElement('div');
            postElement.innerHTML = await this.renderFacebookStylePost(post, index);
            postElement.style.opacity = '0';
            postElement.style.transform = 'translateY(20px)';
            postElement.style.transition = 'all 0.3s ease';

            container.appendChild(postElement);

            // Trigger animation with reduced delay
            setTimeout(() => {
                postElement.style.opacity = '1';
                postElement.style.transform = 'translateY(0)';
            }, index * 50);
        }

        // إعداد تشغيل الفيديوهات تلقائياً بعد إضافة البوستات
        setTimeout(() => {
            this.setupVideoAutoplay();
        }, posts.length * 150 + 500);
    }

    setupVideoAutoplay() {
        const videos = document.querySelectorAll('.post-video');
        let isScrolling = false;
        let scrollTimeout;

        // إدارة التمرير
        const handleScroll = () => {
            isScrolling = true;
            clearTimeout(scrollTimeout);

            // إيقاف جميع الفيديوهات عند التمرير
            videos.forEach(video => {
                if (!video.paused) {
                    video.pause();
                }
            });

            // استئناف التشغيل بعد توقف التمرير
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
                this.resumeVisibleVideos();
            }, 150);
        };

        // إضافة مستمع التمرير
        window.addEventListener('scroll', handleScroll, { passive: true });

        videos.forEach(video => {
            // تفعيل الصوت
            video.muted = false;
            video.volume = 0.7; // مستوى صوت متوسط

            // إعادة تشغيل الفيديو عند تحميله
            video.addEventListener('loadeddata', () => {
                if (!isScrolling) {
                    video.play().catch(e => {
                        console.log('Video autoplay failed:', e);
                        // إذا فشل التشغيل مع الصوت، جرب بدون صوت
                        video.muted = true;
                        video.play().catch(e2 => {
                            console.log('Video muted autoplay also failed:', e2);
                        });
                    });
                }
            });

            video.addEventListener('canplay', () => {
                if (!isScrolling) {
                    video.play().catch(e => {
                        console.log('Video play failed:', e);
                    });
                }
            });

            // إدارة pause/play عند hover
            const container = video.closest('.post-video-container');
            if (container) {
                container.addEventListener('mouseenter', () => {
                    if (!video.paused) {
                        video.pause();
                    }
                });

                container.addEventListener('mouseleave', () => {
                    if (!isScrolling) {
                        video.play().catch(e => {
                            console.log('Video play failed:', e);
                        });
                    }
                });
            }
        });
    }

    resumeVisibleVideos() {
        const videos = document.querySelectorAll('.post-video');
        videos.forEach(video => {
            const rect = video.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

            if (isVisible && video.paused) {
                video.play().catch(e => {
                    console.log('Video resume failed:', e);
                });
            }
        });
    }
}

// Initialize reels manager
const reelsManager = new ReelsManager();

// Function to initialize reels page
async function initializeReelsPage() {
    try {
        // Scroll to top when entering reels page
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });

        await reelsManager.initialize();
        reelsManager.renderReelsSection();
        // Show floating upload button
        const floatingBtn = document.getElementById('floatingUploadBtn');
        if (floatingBtn) {
            floatingBtn.style.display = 'block';
        }
    } catch (error) {
        console.error('Error initializing reels page:', error);
    }
}

// Function to open upload modal
function openUploadModal() {
    // إغلاق جميع الـ popups المفتوحة أولاً
    if (reelsManager) {
        reelsManager.closeAllPopups();
    }

    const uploadModal = document.getElementById('uploadModal');
    if (reelsManager) {
        reelsManager.ensureModalZIndex(uploadModal);
    }

    const modal = new bootstrap.Modal(uploadModal);
    modal.show();

    // إظهار زر الرفع عند إغلاق الـ modal
    uploadModal.addEventListener('hidden.bs.modal', () => {
        document.body.classList.remove('modal-open');
        showFloatingUploadBtn();
    });

    // Setup content type selector when modal opens
    setTimeout(() => {
        reelsManager.setupContentTypeSelector();
    }, 100);
}

// Function to hide floating upload button when leaving reels section
function hideFloatingUploadBtn() {
    const floatingBtn = document.getElementById('floatingUploadBtn');
    if (floatingBtn) {
        floatingBtn.style.display = 'none';
    }
}

// Function to show floating upload button
function showFloatingUploadBtn() {
    const floatingBtn = document.getElementById('floatingUploadBtn');
    if (floatingBtn && reelsManager && reelsManager.currentUser && window.location.hash === '#reels') {
        floatingBtn.style.display = 'block';
    }
}

// Function to fix input fields
function fixInputFields() {
    // إصلاح جميع حقول الإدخال
    const inputs = document.querySelectorAll('input[type="text"], textarea');
    inputs.forEach(input => {
        // إزالة أي قيود على الكتابة
        input.addEventListener('keydown', (e) => {
            // السماح بجميع المفاتيح
            return true;
        });

        input.addEventListener('paste', (e) => {
            // السماح باللصق
            return true;
        });

        input.addEventListener('input', (e) => {
            // السماح بجميع أنواع الإدخال
            return true;
        });

        // إزالة أي قيود على النص
        input.style.whiteSpace = 'pre-wrap';
        input.style.wordWrap = 'break-word';
        input.style.overflowWrap = 'break-word';
    });
}


// Global functions for authentication
async function loginWithGoogle() {
    if (reelsManager) {
        await reelsManager.loginWithGoogle();
    }
}

async function loginWithGoogleFromModal() {
    if (reelsManager) {
        await reelsManager.loginWithGoogle();
    }
}

async function loginWithEmail() {
    if (reelsManager) {
        await reelsManager.loginWithEmail();
    }
}

async function signupWithEmail() {
    if (reelsManager) {
        await reelsManager.signupWithEmail();
    }
}

async function signupWithGoogle() {
    if (reelsManager) {
        await reelsManager.signupWithGoogle();
    }
}

function openAuthModal() {
    if (reelsManager) {
        // إغلاق جميع الـ popups المفتوحة أولاً
        reelsManager.closeAllPopups();
        reelsManager.openAuthModal();
    }
}

function switchToSignup() {
    if (reelsManager) {
        reelsManager.switchToSignup();
    }
}

function switchToLogin() {
    if (reelsManager) {
        reelsManager.switchToLogin();
    }
}

async function logout() {
    if (reelsManager) {
        await reelsManager.logout();
    }
}

async function showUserMenu() {
    if (!reelsManager || !reelsManager.currentUser) {
        showNotification('يرجى تسجيل الدخول أولاً', 'warning');
        return;
    }

    // جلب معلومات المستخدم من Firestore
    let userProfilePicture = null;
    let userEmail = reelsManager.currentUser.email;
    let userDisplayName = reelsManager.currentUser.displayName;

    if (reelsManager.db) {
        try {
            const userDoc = await reelsManager.db.collection('users').doc(reelsManager.currentUser.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                userProfilePicture = userData.profilePicture;
                userEmail = userData.email || userEmail;
                userDisplayName = userData.displayName || userDisplayName;
            }
        } catch (error) {
            console.error('خطأ في جلب معلومات المستخدم:', error);
        }
    }

    // إنشاء modal البروفايل
    const profileModal = document.createElement('div');
    profileModal.className = 'modal fade unified-modal';
    profileModal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        الملف الشخصي
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center">
                    <div class="profile-picture-container mb-3">
                        ${userProfilePicture
            ? `<img src="${userProfilePicture}" alt="صورة المستخدم" class="profile-picture-large">`
            : `<div class="profile-picture-placeholder"><i class="bi bi-person-circle"></i></div>`
        }
                    </div>
                    <h4 class="mb-2">${userDisplayName || 'مجهول'}</h4>
                    <p class="text-muted mb-3">${userEmail || 'لا يوجد بريد إلكتروني'}</p>
                    <div class="profile-actions">
                        <button class="btn btn-outline-primary me-2" onclick="updateProfilePicture()">
                            <i class="bi bi-camera me-1"></i>
                            تحديث الصورة الشخصية
                        </button>
                        <button class="btn btn-outline-secondary" onclick="editProfile()">
                            <i class="bi bi-pencil me-1"></i>
                            تعديل الملف الشخصي
                        </button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(profileModal);

    if (reelsManager) {
        reelsManager.ensureModalZIndex(profileModal);
    }

    const modal = new bootstrap.Modal(profileModal);
    modal.show();

    // إزالة modal عند الإغلاق
    profileModal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(profileModal);
        document.body.classList.remove('modal-open');
        showFloatingUploadBtn();
    });
}

// دالة تحديث الصورة الشخصية
async function updateProfilePicture() {
    if (!reelsManager || !reelsManager.currentUser) {
        showNotification('يرجى تسجيل الدخول أولاً', 'warning');
        return;
    }

    // إنشاء input للاختيار
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            showNotification('جاري تحديث الصورة الشخصية...', 'info');

            // اختبار النظام أولاً
            const isConnected = await reelsManager.testSystemConnection();
            if (!isConnected) {
                throw new Error('فشل في تحميل الإعدادات أو الاتصال بـ GitHub');
            }

            // رفع الصورة إلى GitHub
            const profilePictureUrl = await reelsManager.uploadToGitHub(file);

            // تحديث البيانات في Firestore
            await reelsManager.db.collection('users').doc(reelsManager.currentUser.uid).update({
                profilePicture: profilePictureUrl
            });

            showNotification('تم تحديث الصورة الشخصية بنجاح!', 'success');

            // إعادة تحميل المنشورات لإظهار الصورة الجديدة
            if (reelsManager.loadAndDisplayPosts) {
                await reelsManager.loadAndDisplayPosts();
            }

        } catch (error) {
            console.error('خطأ في تحديث الصورة الشخصية:', error);
            showNotification('حدث خطأ أثناء تحديث الصورة الشخصية', 'error');
        }
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

// دالة تعديل الملف الشخصي
function editProfile() {
    showNotification('ميزة تعديل الملف الشخصي قريباً!', 'info');
}

// دالة تنسيق التاريخ
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    // إذا كان اليوم نفسه
    if (diffInDays === 0) {
        return date.toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }
    // إذا كان أمس
    else if (diffInDays === 1) {
        return 'أمس ' + date.toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }
    // إذا كان قبل أمس
    else if (diffInDays === 2) {
        return 'منذ يومين ' + date.toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }
    // إذا كان قبل أسبوع
    else if (diffInDays < 7) {
        return 'منذ ' + diffInDays + ' أيام ' + date.toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }
    // إذا كان قبل شهر
    else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return 'منذ ' + weeks + ' أسبوع' + (weeks > 1 ? 'ات' : '');
    }
    // إذا كان قبل سنة
    else if (diffInDays < 365) {
        const months = Math.floor(diffInDays / 30);
        return 'منذ ' + months + ' شهر' + (months > 1 ? 'ات' : '');
    }
    // إذا كان قبل أكثر من سنة
    else {
        const years = Math.floor(diffInDays / 365);
        return 'منذ ' + years + ' سنة' + (years > 1 ? 'ات' : '');
    }
}

// دالة عرض بروفايل المستخدم
async function showUserProfile(userId, username) {
    if (!userId || !reelsManager || !reelsManager.db) {
        showNotification('لا يمكن عرض البروفايل', 'warning');
        return;
    }

    try {
        // جلب معلومات المستخدم من Firestore
        const userDoc = await reelsManager.db.collection('users').doc(userId).get();
        let userData = null;
        let userProfilePicture = null;
        let userEmail = '';
        let userDisplayName = username;

        if (userDoc.exists) {
            userData = userDoc.data();
            userProfilePicture = userData.profilePicture;
            userEmail = userData.email || '';
            userDisplayName = userData.displayName || username;
        }

        // جلب منشورات المستخدم (بدون orderBy لتجنب الحاجة للفهرس)
        let userPosts = [];
        try {
            if (userId) {
                // للمنشورات الجديدة التي تحتوي على userId
                const userPostsQuery = await reelsManager.db.collection('posts')
                    .where('userId', '==', userId)
                    .limit(20)
                    .get();

                userPosts = userPostsQuery.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            } else {
                // للمنشورات القديمة - البحث بالاسم
                const userPostsQuery = await reelsManager.db.collection('posts')
                    .where('username', '==', username)
                    .limit(20)
                    .get();

                userPosts = userPostsQuery.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            }

            // ترتيب المنشورات حسب التاريخ يدوياً
            userPosts.sort((a, b) => {
                const dateA = new Date(a.date || 0);
                const dateB = new Date(b.date || 0);
                return dateB - dateA; // ترتيب تنازلي (الأحدث أولاً)
            });

            // أخذ أول 10 منشورات فقط
            userPosts = userPosts.slice(0, 10);
        } catch (postsError) {
            console.error('خطأ في جلب منشورات المستخدم:', postsError);
            // نستمر في عرض البروفايل حتى لو فشل جلب المنشورات
        }

        // إنشاء modal البروفايل
        const profileModal = document.createElement('div');
        profileModal.className = 'modal fade unified-modal';
        profileModal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-person-circle me-2"></i>
                            بروفايل ${userDisplayName}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <!-- معلومات المستخدم -->
                        <div class="user-profile-info text-center mb-4">
                            <div class="profile-picture-container mb-3">
                                ${userProfilePicture
                ? `<img src="${userProfilePicture}" alt="صورة المستخدم" class="profile-picture-large">`
                : `<img src="${reelsManager.createDefaultAvatar(userDisplayName)}" alt="صورة المستخدم" class="profile-picture-large">`
            }
                            </div>
                            <h4 class="mb-2">${userDisplayName}</h4>
                            ${userEmail ? `<p class="text-muted mb-3">${userEmail}</p>` : ''}
                        </div>

                        <!-- منشورات المستخدم -->
                        <div class="user-posts-section">
                            <h6 class="mb-3">
                                <i class="bi bi-grid-3x3-gap me-2"></i>
                                منشورات ${userDisplayName}
                            </h6>
                            <div class="user-posts-container" id="userPostsContainer">
                                ${userPosts.length > 0 ?
                userPosts.map(post => `
                                        <div class="user-post-item">
                                            <div class="post-content-preview">
                                                ${post.type === 'text' ?
                        `<p class="mb-1">${post.text ? post.text.substring(0, 100) + (post.text.length > 100 ? '...' : '') : ''}</p>` :
                        post.type === 'image' ?
                            `<div class="post-image-preview"><img src="${post.image}" alt="صورة" class="img-fluid rounded"></div>` :
                            post.type === 'video' ?
                                `<div class="post-video-preview"><video src="${post.video}" class="img-fluid rounded" muted></video></div>` :
                                ''
                    }
                                            </div>
                                            <div class="post-meta-preview">
                                                <small class="text-muted">${formatDate(post.date)}</small>
                                            </div>
                                        </div>
                                    `).join('') :
                `<div class="text-center text-muted py-3">
                                        <i class="bi bi-inbox display-4"></i>
                                        <p class="mt-2">لا توجد منشورات</p>
                                    </div>`
            }
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(profileModal);

        if (reelsManager) {
            reelsManager.ensureModalZIndex(profileModal);
        }

        const modal = new bootstrap.Modal(profileModal);
        modal.show();

        // إزالة modal عند الإغلاق
        profileModal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(profileModal);
            document.body.classList.remove('modal-open');
            showFloatingUploadBtn();
        });

    } catch (error) {
        console.error('خطأ في عرض بروفايل المستخدم:', error);
        showNotification('حدث خطأ أثناء عرض البروفايل', 'error');
    }
}

function confirmLogout() {
    // إغلاق السايد بار أولاً
    if (reelsManager) {
        reelsManager.closeSidebar();
    }

    // إنشاء modal تأكيد مخصص
    const confirmModal = document.createElement('div');
    confirmModal.className = 'modal fade unified-modal';
    confirmModal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        تأكيد تسجيل الخروج
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>هل أنت متأكد من تسجيل الخروج؟</p>
                    <p class="text-muted small">ستحتاج إلى تسجيل الدخول مرة أخرى للوصول إلى حسابك.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                    <button type="button" class="btn btn-danger" id="confirmLogoutBtn">
                        تسجيل الخروج
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(confirmModal);

    if (reelsManager) {
        reelsManager.ensureModalZIndex(confirmModal);
    }

    const modal = new bootstrap.Modal(confirmModal);
    modal.show();

    // إضافة event listener للزر
    document.getElementById('confirmLogoutBtn').addEventListener('click', () => {
        modal.hide();
        logout();
        document.body.removeChild(confirmModal);
        document.body.classList.remove('modal-open');
        showFloatingUploadBtn();
    });

    // إزالة modal عند الإغلاق
    confirmModal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(confirmModal);
        document.body.classList.remove('modal-open');
        showFloatingUploadBtn();
    });
}

function openFirebaseConsole() {
    const currentDomain = window.location.hostname;
    const instructions = `
🔧 إعداد Firebase Console:

1. اذهب إلى: https://console.firebase.google.com/
2. اختر مشروعك
3. اذهب إلى: Authentication → Sign-in method
4. اضغط على Google → Edit
5. في قسم "Authorized domains" اضغط "Add domain"
6. أضف هذا النطاق: ${currentDomain}
7. اضغط Save

النطاق الحالي: ${currentDomain}
الرابط الكامل: ${window.location.origin}
    `;

    showInfo(instructions);

    // فتح Firebase Console في نافذة جديدة
    window.open('https://console.firebase.google.com/', '_blank');
}

function openFullscreen(mediaUrl, mediaType) {
    const fullscreenModal = document.createElement('div');
    fullscreenModal.className = 'fullscreen-modal unified-modal';
    fullscreenModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        backdrop-filter: blur(0px);
        opacity: 0;
        transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    `;

    // إنشاء عنصر المحتوى
    const mediaContainer = document.createElement('div');
    mediaContainer.className = 'modal-content';
    mediaContainer.style.cssText = `
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        border: 2px solid #17a2b8;
        border-radius: 25px;
        position: relative;
        max-width: 95%;
        max-height: 95%;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: scale(0.1) rotate(15deg) translateY(100px);
        transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        filter: blur(20px);
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
        overflow: hidden;
    `;

    // إضافة الخط العلوي
    const topLine = document.createElement('div');
    topLine.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 5px;
        background: linear-gradient(135deg, #17a2b8 0%, #0f766e 100%);
        z-index: 1;
    `;
    mediaContainer.appendChild(topLine);

    let mediaElement;
    if (mediaType === 'image') {
        mediaElement = document.createElement('img');
        mediaElement.src = mediaUrl;
        mediaElement.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            border-radius: 20px;
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
            transform: scale(0.5) rotate(-10deg);
            transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
            filter: blur(10px);
        `;
    } else if (mediaType === 'video') {
        mediaElement = document.createElement('video');
        mediaElement.src = mediaUrl;
        mediaElement.controls = true;
        mediaElement.autoplay = true;
        mediaElement.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            border-radius: 20px;
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
            transform: scale(0.5) rotate(-10deg);
            transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
            filter: blur(10px);
        `;
    }

    // زر الإغلاق
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="bi bi-x-lg"></i>';
    closeBtn.className = 'btn-close';
    closeBtn.style.cssText = `
        position: absolute;
        right: 1rem;
        top: 1rem;
        z-index: 10;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        width: 2.5rem;
        height: 2.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        color: white;
        font-size: 1.2rem;
        transition: all 0.3s ease;
        cursor: pointer;
        z-index: 1000000;
        transform: scale(0) rotate(180deg);
        opacity: 0;
        box-shadow: 0 10px 30px rgba(255, 77, 77, 0.4);
    `;

    // زر التنزيل
    const downloadBtn = document.createElement('button');
    downloadBtn.innerHTML = '<i class="bi bi-download"></i>';
    downloadBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 90px;
        background: linear-gradient(135deg, rgba(33, 150, 243, 0.9), rgba(30, 136, 229, 0.9));
        border: 2px solid rgba(255, 255, 255, 0.3);
        color: white;
        font-size: 18px;
        width: 55px;
        height: 55px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(20px);
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        z-index: 1000000;
        transform: scale(0) rotate(-180deg);
        opacity: 0;
        box-shadow: 0 10px 30px rgba(33, 150, 243, 0.4);
    `;

    // تأثيرات hover للأزرار
    const addButtonHoverEffects = (btn) => {
        btn.addEventListener('mouseenter', () => {
            if (btn === closeBtn) {
                btn.style.background = 'linear-gradient(135deg, rgba(255, 99, 99, 1), rgba(255, 77, 77, 1))';
                btn.style.transform = 'scale(1.2) rotate(5deg)';
                btn.style.boxShadow = '0 15px 40px rgba(255, 77, 77, 0.6)';
            } else if (btn === downloadBtn) {
                btn.style.background = 'linear-gradient(135deg, rgba(66, 165, 245, 1), rgba(33, 150, 243, 1))';
                btn.style.transform = 'scale(1.2) rotate(-5deg)';
                btn.style.boxShadow = '0 15px 40px rgba(33, 150, 243, 0.6)';
            }
        });

        btn.addEventListener('mouseleave', () => {
            if (btn === closeBtn) {
                btn.style.background = 'linear-gradient(135deg, rgba(255, 77, 77, 0.9), rgba(244, 67, 54, 0.9))';
                btn.style.transform = 'scale(1) rotate(0deg)';
                btn.style.boxShadow = '0 10px 30px rgba(255, 77, 77, 0.4)';
            } else if (btn === downloadBtn) {
                btn.style.background = 'linear-gradient(135deg, rgba(33, 150, 243, 0.9), rgba(30, 136, 229, 0.9))';
                btn.style.transform = 'scale(1) rotate(0deg)';
                btn.style.boxShadow = '0 10px 30px rgba(33, 150, 243, 0.4)';
            }
        });
    };

    addButtonHoverEffects(closeBtn);
    addButtonHoverEffects(downloadBtn);

    // تجميع العناصر
    mediaContainer.appendChild(mediaElement);
    mediaContainer.appendChild(closeBtn);
    mediaContainer.appendChild(downloadBtn);
    fullscreenModal.appendChild(mediaContainer);

    // إضافة modal إلى الصفحة
    document.body.appendChild(fullscreenModal);

    // منع التمرير في الخلفية
    document.body.style.overflow = 'hidden';

    // أنيميشن الظهور المتدرج
    setTimeout(() => {
        // المرحلة الأولى: ظهور الخلفية
        fullscreenModal.style.background = 'rgba(0, 0, 0, 0.95)';
        fullscreenModal.style.backdropFilter = 'blur(15px)';
        fullscreenModal.style.opacity = '1';
    }, 50);

    setTimeout(() => {
        // المرحلة الثانية: ظهور المحتوى
        mediaContainer.style.transform = 'scale(1) rotate(0deg) translateY(0px)';
        mediaContainer.style.filter = 'blur(0px)';
        mediaElement.style.transform = 'scale(1) rotate(0deg)';
        mediaElement.style.filter = 'blur(0px)';
    }, 200);

    setTimeout(() => {
        // المرحلة الثالثة: ظهور الأزرار
        closeBtn.style.transform = 'scale(1) rotate(0deg)';
        closeBtn.style.opacity = '1';
        downloadBtn.style.transform = 'scale(1) rotate(0deg)';
        downloadBtn.style.opacity = '1';
    }, 600);

    // دالة الإغلاق مع أنيميشن متدرج
    const closeFullscreen = () => {
        // المرحلة الأولى: إخفاء الأزرار
        closeBtn.style.transform = 'scale(0) rotate(180deg)';
        closeBtn.style.opacity = '0';
        downloadBtn.style.transform = 'scale(0) rotate(-180deg)';
        downloadBtn.style.opacity = '0';

        setTimeout(() => {
            // المرحلة الثانية: إخفاء المحتوى
            mediaContainer.style.transform = 'scale(0.1) rotate(-15deg) translateY(50px)';
            mediaElement.style.transform = 'scale(0.5) rotate(10deg)';
            mediaContainer.style.filter = 'blur(10px)';
            mediaElement.style.filter = 'blur(5px)';
        }, 150);

        setTimeout(() => {
            // المرحلة الثالثة: إخفاء الخلفية
            fullscreenModal.style.opacity = '0';
            fullscreenModal.style.background = 'rgba(0, 0, 0, 0)';
            fullscreenModal.style.backdropFilter = 'blur(0px)';
        }, 300);

        setTimeout(() => {
            // إزالة العنصر
            if (fullscreenModal.parentNode) {
                fullscreenModal.parentNode.removeChild(fullscreenModal);
            }
            document.body.style.overflow = '';
        }, 600);
    };

    // دالة التنزيل
    const downloadMedia = () => {
        try {
            const link = document.createElement('a');
            link.href = mediaUrl;
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const extension = mediaType === 'image' ? 'jpg' : 'mp4';
            link.download = `quran_cast_${mediaType}_${timestamp}.${extension}`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showNotification(`تم تحميل ${mediaType === 'image' ? 'الصورة' : 'الفيديو'} بنجاح`, 'success');
        } catch (error) {
            console.error('Error downloading media:', error);
            showNotification('حدث خطأ أثناء تحميل الملف', 'error');
        }
    };

    // إضافة مستمعي الأحداث
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeFullscreen();
    });

    downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadMedia();
    });

    fullscreenModal.addEventListener('click', (e) => {
        if (e.target === fullscreenModal) {
            closeFullscreen();
        }
    });

    // إغلاق بالضغط على Escape
    const handleKeyPress = (e) => {
        if (e.key === 'Escape') {
            closeFullscreen();
            document.removeEventListener('keydown', handleKeyPress);
        }
    };
    document.addEventListener('keydown', handleKeyPress);
}

// إضافة الدالة إلى window object
window.openFullscreen = openFullscreen;


// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // إصلاح حقول الإدخال عند تحميل الصفحة
    fixInputFields();

    // تهيئة حالة المصادقة
    if (reelsManager) {
        reelsManager.checkAuthState();
    }

    // The reels page will be initialized when the hash changes to #reels
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (reelsManager) {
        reelsManager.cleanupFirebaseListeners();
    }
});

