// ====== SoundCloud Style Quran Player ======

class SoundCloudQuranPlayer {
    constructor() {
        this.audio = new Audio();
        this.currentSurah = null;
        this.currentAyah = 0;
        this.playlist = [];
        this.isPlaying = false;
        this.isExpanded = false;
        this.volume = 0.7;
        this.playbackRate = 1.0;
        this.currentReciter = 'ar.alafasy';
        this.totalSurahs = 114; // إجمالي عدد السور
        this.currentSurahIndex = 0; // فهرس السورة الحالية

        // Static list of all 114 surahs with IDs
        this.surahs = [
            { id: 1, number: 1, name: 'الفاتحة', englishName: 'Al-Fatihah', numberOfAyahs: 7 },
            { id: 2, number: 2, name: 'البقرة', englishName: 'Al-Baqarah', numberOfAyahs: 286 },
            { id: 3, number: 3, name: 'آل عمران', englishName: 'Ali \'Imran', numberOfAyahs: 200 },
            { id: 4, number: 4, name: 'النساء', englishName: 'An-Nisa', numberOfAyahs: 176 },
            { id: 5, number: 5, name: 'المائدة', englishName: 'Al-Ma\'idah', numberOfAyahs: 120 },
            { id: 6, number: 6, name: 'الأنعام', englishName: 'Al-An\'am', numberOfAyahs: 165 },
            { id: 7, number: 7, name: 'الأعراف', englishName: 'Al-A\'raf', numberOfAyahs: 206 },
            { id: 8, number: 8, name: 'الأنفال', englishName: 'Al-Anfal', numberOfAyahs: 75 },
            { id: 9, number: 9, name: 'التوبة', englishName: 'At-Tawbah', numberOfAyahs: 129 },
            { id: 10, number: 10, name: 'يونس', englishName: 'Yunus', numberOfAyahs: 109 },
            { id: 11, number: 11, name: 'هود', englishName: 'Hud', numberOfAyahs: 123 },
            { id: 12, number: 12, name: 'يوسف', englishName: 'Yusuf', numberOfAyahs: 111 },
            { id: 13, number: 13, name: 'الرعد', englishName: 'Ar-Ra\'d', numberOfAyahs: 43 },
            { id: 14, number: 14, name: 'إبراهيم', englishName: 'Ibrahim', numberOfAyahs: 52 },
            { id: 15, number: 15, name: 'الحجر', englishName: 'Al-Hijr', numberOfAyahs: 99 },
            { id: 16, number: 16, name: 'النحل', englishName: 'An-Nahl', numberOfAyahs: 128 },
            { id: 17, number: 17, name: 'الإسراء', englishName: 'Al-Isra', numberOfAyahs: 111 },
            { id: 18, number: 18, name: 'الكهف', englishName: 'Al-Kahf', numberOfAyahs: 110 },
            { id: 19, number: 19, name: 'مريم', englishName: 'Maryam', numberOfAyahs: 98 },
            { id: 20, number: 20, name: 'طه', englishName: 'Taha', numberOfAyahs: 135 },
            { id: 21, number: 21, name: 'الأنبياء', englishName: 'Al-Anbiya', numberOfAyahs: 112 },
            { id: 22, number: 22, name: 'الحج', englishName: 'Al-Hajj', numberOfAyahs: 78 },
            { id: 23, number: 23, name: 'المؤمنون', englishName: 'Al-Mu\'minun', numberOfAyahs: 118 },
            { id: 24, number: 24, name: 'النور', englishName: 'An-Nur', numberOfAyahs: 64 },
            { id: 25, number: 25, name: 'الفرقان', englishName: 'Al-Furqan', numberOfAyahs: 77 },
            { id: 26, number: 26, name: 'الشعراء', englishName: 'Ash-Shu\'ara', numberOfAyahs: 227 },
            { id: 27, number: 27, name: 'النمل', englishName: 'An-Naml', numberOfAyahs: 93 },
            { id: 28, number: 28, name: 'القصص', englishName: 'Al-Qasas', numberOfAyahs: 88 },
            { id: 29, number: 29, name: 'العنكبوت', englishName: 'Al-\'Ankabut', numberOfAyahs: 69 },
            { id: 30, number: 30, name: 'الروم', englishName: 'Ar-Rum', numberOfAyahs: 60 },
            { id: 31, number: 31, name: 'لقمان', englishName: 'Luqman', numberOfAyahs: 34 },
            { id: 32, number: 32, name: 'السجدة', englishName: 'As-Sajdah', numberOfAyahs: 30 },
            { id: 33, number: 33, name: 'الأحزاب', englishName: 'Al-Ahzab', numberOfAyahs: 73 },
            { id: 34, number: 34, name: 'سبأ', englishName: 'Saba', numberOfAyahs: 54 },
            { id: 35, number: 35, name: 'فاطر', englishName: 'Fatir', numberOfAyahs: 45 },
            { id: 36, number: 36, name: 'يس', englishName: 'Ya-Sin', numberOfAyahs: 83 },
            { id: 37, number: 37, name: 'الصافات', englishName: 'As-Saffat', numberOfAyahs: 182 },
            { id: 38, number: 38, name: 'ص', englishName: 'Sad', numberOfAyahs: 88 },
            { id: 39, number: 39, name: 'الزمر', englishName: 'Az-Zumar', numberOfAyahs: 75 },
            { id: 40, number: 40, name: 'غافر', englishName: 'Ghafir', numberOfAyahs: 85 },
            { id: 41, number: 41, name: 'فصلت', englishName: 'Fussilat', numberOfAyahs: 54 },
            { id: 42, number: 42, name: 'الشورى', englishName: 'Ash-Shura', numberOfAyahs: 53 },
            { id: 43, number: 43, name: 'الزخرف', englishName: 'Az-Zukhruf', numberOfAyahs: 89 },
            { id: 44, number: 44, name: 'الدخان', englishName: 'Ad-Dukhan', numberOfAyahs: 59 },
            { id: 45, number: 45, name: 'الجاثية', englishName: 'Al-Jathiyah', numberOfAyahs: 37 },
            { id: 46, number: 46, name: 'الأحقاف', englishName: 'Al-Ahqaf', numberOfAyahs: 35 },
            { id: 47, number: 47, name: 'محمد', englishName: 'Muhammad', numberOfAyahs: 38 },
            { id: 48, number: 48, name: 'الفتح', englishName: 'Al-Fath', numberOfAyahs: 29 },
            { id: 49, number: 49, name: 'الحجرات', englishName: 'Al-Hujurat', numberOfAyahs: 18 },
            { id: 50, number: 50, name: 'ق', englishName: 'Qaf', numberOfAyahs: 45 },
            { id: 51, number: 51, name: 'الذاريات', englishName: 'Adh-Dhariyat', numberOfAyahs: 60 },
            { id: 52, number: 52, name: 'الطور', englishName: 'At-Tur', numberOfAyahs: 49 },
            { id: 53, number: 53, name: 'النجم', englishName: 'An-Najm', numberOfAyahs: 62 },
            { id: 54, number: 54, name: 'القمر', englishName: 'Al-Qamar', numberOfAyahs: 55 },
            { id: 55, number: 55, name: 'الرحمن', englishName: 'Ar-Rahman', numberOfAyahs: 78 },
            { id: 56, number: 56, name: 'الواقعة', englishName: 'Al-Waqi\'ah', numberOfAyahs: 96 },
            { id: 57, number: 57, name: 'الحديد', englishName: 'Al-Hadid', numberOfAyahs: 29 },
            { id: 58, number: 58, name: 'المجادلة', englishName: 'Al-Mujadila', numberOfAyahs: 22 },
            { id: 59, number: 59, name: 'الحشر', englishName: 'Al-Hashr', numberOfAyahs: 24 },
            { id: 60, number: 60, name: 'الممتحنة', englishName: 'Al-Mumtahanah', numberOfAyahs: 13 },
            { id: 61, number: 61, name: 'الصف', englishName: 'As-Saff', numberOfAyahs: 14 },
            { id: 62, number: 62, name: 'الجمعة', englishName: 'Al-Jumu\'ah', numberOfAyahs: 11 },
            { id: 63, number: 63, name: 'المنافقون', englishName: 'Al-Munafiqun', numberOfAyahs: 11 },
            { id: 64, number: 64, name: 'التغابن', englishName: 'At-Taghabun', numberOfAyahs: 18 },
            { id: 65, number: 65, name: 'الطلاق', englishName: 'At-Talaq', numberOfAyahs: 12 },
            { id: 66, number: 66, name: 'التحريم', englishName: 'At-Tahrim', numberOfAyahs: 12 },
            { id: 67, number: 67, name: 'الملك', englishName: 'Al-Mulk', numberOfAyahs: 30 },
            { id: 68, number: 68, name: 'القلم', englishName: 'Al-Qalam', numberOfAyahs: 52 },
            { id: 69, number: 69, name: 'الحاقة', englishName: 'Al-Haqqah', numberOfAyahs: 52 },
            { id: 70, number: 70, name: 'المعارج', englishName: 'Al-Ma\'arij', numberOfAyahs: 44 },
            { id: 71, number: 71, name: 'نوح', englishName: 'Nuh', numberOfAyahs: 28 },
            { id: 72, number: 72, name: 'الجن', englishName: 'Al-Jinn', numberOfAyahs: 28 },
            { id: 73, number: 73, name: 'المزمل', englishName: 'Al-Muzzammil', numberOfAyahs: 20 },
            { id: 74, number: 74, name: 'المدثر', englishName: 'Al-Muddaththir', numberOfAyahs: 56 },
            { id: 75, number: 75, name: 'القيامة', englishName: 'Al-Qiyamah', numberOfAyahs: 40 },
            { id: 76, number: 76, name: 'الإنسان', englishName: 'Al-Insan', numberOfAyahs: 31 },
            { id: 77, number: 77, name: 'المرسلات', englishName: 'Al-Mursalat', numberOfAyahs: 50 },
            { id: 78, number: 78, name: 'النبأ', englishName: 'An-Naba', numberOfAyahs: 40 },
            { id: 79, number: 79, name: 'النازعات', englishName: 'An-Nazi\'at', numberOfAyahs: 46 },
            { id: 80, number: 80, name: 'عبس', englishName: '\'Abasa', numberOfAyahs: 42 },
            { id: 81, number: 81, name: 'التكوير', englishName: 'At-Takwir', numberOfAyahs: 29 },
            { id: 82, number: 82, name: 'الانفطار', englishName: 'Al-Infitar', numberOfAyahs: 19 },
            { id: 83, number: 83, name: 'المطففين', englishName: 'Al-Mutaffifin', numberOfAyahs: 36 },
            { id: 84, number: 84, name: 'الانشقاق', englishName: 'Al-Inshiqaq', numberOfAyahs: 25 },
            { id: 85, number: 85, name: 'البروج', englishName: 'Al-Buruj', numberOfAyahs: 22 },
            { id: 86, number: 86, name: 'الطارق', englishName: 'At-Tariq', numberOfAyahs: 17 },
            { id: 87, number: 87, name: 'الأعلى', englishName: 'Al-A\'la', numberOfAyahs: 19 },
            { id: 88, number: 88, name: 'الغاشية', englishName: 'Al-Ghashiyah', numberOfAyahs: 26 },
            { id: 89, number: 89, name: 'الفجر', englishName: 'Al-Fajr', numberOfAyahs: 30 },
            { id: 90, number: 90, name: 'البلد', englishName: 'Al-Balad', numberOfAyahs: 20 },
            { id: 91, number: 91, name: 'الشمس', englishName: 'Ash-Shams', numberOfAyahs: 15 },
            { id: 92, number: 92, name: 'الليل', englishName: 'Al-Layl', numberOfAyahs: 21 },
            { id: 93, number: 93, name: 'الضحى', englishName: 'Ad-Duha', numberOfAyahs: 11 },
            { id: 94, number: 94, name: 'الشرح', englishName: 'Ash-Sharh', numberOfAyahs: 8 },
            { id: 95, number: 95, name: 'التين', englishName: 'At-Tin', numberOfAyahs: 8 },
            { id: 96, number: 96, name: 'العلق', englishName: 'Al-\'Alaq', numberOfAyahs: 19 },
            { id: 97, number: 97, name: 'القدر', englishName: 'Al-Qadr', numberOfAyahs: 5 },
            { id: 98, number: 98, name: 'البينة', englishName: 'Al-Bayyinah', numberOfAyahs: 8 },
            { id: 99, number: 99, name: 'الزلزلة', englishName: 'Az-Zalzalah', numberOfAyahs: 8 },
            { id: 100, number: 100, name: 'العاديات', englishName: 'Al-\'Adiyat', numberOfAyahs: 11 },
            { id: 101, number: 101, name: 'القارعة', englishName: 'Al-Qari\'ah', numberOfAyahs: 11 },
            { id: 102, number: 102, name: 'التكاثر', englishName: 'At-Takathur', numberOfAyahs: 8 },
            { id: 103, number: 103, name: 'العصر', englishName: 'Al-\'Asr', numberOfAyahs: 3 },
            { id: 104, number: 104, name: 'الهمزة', englishName: 'Al-Humazah', numberOfAyahs: 9 },
            { id: 105, number: 105, name: 'الفيل', englishName: 'Al-Fil', numberOfAyahs: 5 },
            { id: 106, number: 106, name: 'قريش', englishName: 'Quraysh', numberOfAyahs: 4 },
            { id: 107, number: 107, name: 'الماعون', englishName: 'Al-Ma\'un', numberOfAyahs: 7 },
            { id: 108, number: 108, name: 'الكوثر', englishName: 'Al-Kawthar', numberOfAyahs: 3 },
            { id: 109, number: 109, name: 'الكافرون', englishName: 'Al-Kafirun', numberOfAyahs: 6 },
            { id: 110, number: 110, name: 'النصر', englishName: 'An-Nasr', numberOfAyahs: 3 },
            { id: 111, number: 111, name: 'المسد', englishName: 'Al-Masad', numberOfAyahs: 5 },
            { id: 112, number: 112, name: 'الإخلاص', englishName: 'Al-Ikhlas', numberOfAyahs: 4 },
            { id: 113, number: 113, name: 'الفلق', englishName: 'Al-Falaq', numberOfAyahs: 5 },
            { id: 114, number: 114, name: 'الناس', englishName: 'An-Nas', numberOfAyahs: 6 }
        ];

        // Reciter images mapping
        this.reciterImages = {
            'ar.alafasy': 'media/images/afasy.jpg',
            'ar.yasseraldossari': 'media/images/dosary.jpg',

            'ar.abdulbasitmurattal': 'media/images/abdelbaset.jpg',
            'ar.abdulbasitmujawwad': 'media/images/abdelbaset.jpg',

            'ar.ahmedalajmi': 'media/images/ahmedajamy.jpg',
            'ar.muhammadayyub': 'media/images/ayoub.jpg',

            'ar.abdulazizazzahrani': 'media/images/zahrany.jpg',
            'ar.muhammadsiddiqalminshawimujawwad': 'media/images/menshawy.jpg',
            'ar.mustafaismail': 'media/images/m_ismaiel.jpg',

            // New reciters
            'ar.abdullahalmatrood': 'media/images/logo.jpg',
            'ar.abdullahawadaljuhani': 'media/images/logo.jpg',
            'ar.abdullahbasfar': 'media/images/logo.jpg',
            'ar.abdullahkhayat': 'media/images/logo.jpg',
            'ar.abdullahkhulaifi': 'media/images/logo.jpg',
            'ar.abdulmohsenalharthy': 'media/images/logo.jpg',
            'ar.abdulmuhsinalqasim': 'media/images/logo.jpg',
            'ar.abdulmunimabdulmubdi': 'media/images/logo.jpg',
            'ar.abdulwadoodhaneef': 'media/images/logo.jpg',
            'ar.abdurrasheedsufiabialhaarithanalkasaaee': 'media/images/logo.jpg',
            'ar.abdurrasheedsufiaddoorianabiamr': 'media/images/logo.jpg',
            'ar.abdurrasheedsufishubahanasim': 'media/images/logo.jpg',
            'ar.abdurrasheedsufisoosi': 'media/images/logo.jpg',
            'ar.abdurrazaqbinabtanaldulaimi': 'media/images/logo.jpg',
            'ar.abuabdullahmuniraltounsi': 'media/images/logo.jpg',
            'ar.abubakraldhabi': 'media/images/logo.jpg',

            // Additional reciters
            'ar.adilkalbani': 'media/images/logo.jpg',
            'ar.ahmadalhawashy': 'media/images/logo.jpg',
            'ar.ahmadalnufais': 'media/images/logo.jpg',
            'ar.ahmadkhaderaltarabulsi': 'media/images/logo.jpg',
            'ar.ahmadsulaiman': 'media/images/logo.jpg',
            'ar.ahmedalhammad': 'media/images/logo.jpg',
            'ar.ahmedalmisbahi': 'media/images/logo.jpg',
            'ar.ahmedamir': 'media/images/logo.jpg',
            'ar.ahmedmohamedsalama': 'media/images/logo.jpg',
            'ar.ahmedsaber': 'media/images/logo.jpg',
            'ar.alashryomran': 'media/images/logo.jpg'
        };

        this.init();
    }

    async init() {
        this.createPlayerHTML();
        this.setupEventListeners();
        this.setupAudioEvents();
        await this.loadSurahs();
        this.loadSettings();

        // Show the player container and mini player initially
        const container = document.getElementById('quranPlayerContainer');
        if (container) {
            container.classList.remove('hide');
            container.classList.add('show');
            container.style.display = 'block';
        }

        // Show the floating button
        this.showFloatingButton();

        // Ensure reciter image is updated after HTML is created
        setTimeout(() => {
            this.updateReciterImage();
        }, 100);

        // Additional call to ensure image is updated
        setTimeout(() => {
            this.updateReciterImage();
            this.updateCurrentReciterDisplay();
        }, 500);

        // Make sure the player is always visible
        setTimeout(() => {
            this.ensurePlayerVisible();
        }, 1000);
    }

    createPlayerHTML() {
        // Create player container
        const playerContainer = document.createElement('div');
        playerContainer.className = 'quran-player-container show';
        playerContainer.id = 'quranPlayerContainer';

        playerContainer.innerHTML = `
            <!-- Mini Player -->
            <div class="mini-player" id="miniPlayer">
                <div class="mini-player-info">
                    <div class="mini-player-thumbnail" id="miniThumbnail">
                        <i class="bi bi-headphones" id="miniDefaultIcon" class="active"></i>
                        <img id="miniReciterImage" src="" alt="" style="display: none;" />
                    </div>
                    <div class="mini-player-text">
                        <div class="mini-player-title" id="miniTitle">اختر سورة للاستماع</div>
                        <div class="mini-player-subtitle" id="miniSubtitle">
                            <span>اضغط للفتح</span>
                            <div class="mini-visualizer" id="miniVisualizer" style="display: none;">
                                <div class="mini-bar"></div>
                                <div class="mini-bar"></div>
                                <div class="mini-bar"></div>
                                <div class="mini-bar"></div>
                                <div class="mini-bar"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mini-player-controls">
                                            <button class="mini-player-btn" id="miniPlayBtn">
                            <i class="bi bi-play-circle-fill" id="miniPlayIcon"></i>
                        </button>
                            <button class="mini-player-btn" id="expandBtn">
                            <i class="bi bi-arrow-down-circle" id="expandIcon"></i>
                        </button>
                </div>
            </div>

            <!-- Full Player -->
            <div class="full-player" id="fullPlayer" style="display: none;">
                <!-- Player Header -->

<div class="bg-light">
  <div style="width: 100%; height: 100%; padding: 0; margin: 0;"  class="container">
    <div class="audio-player">
      <div class="album-art">
        <img src="media/images/logo.jpg" alt="Album Art" style="width: 100%; height: 100%; object-fit: cover;">
      </div>

      <div class="visualizer">
        <div class="bar" style="animation-delay: -0.4s"></div>
        <div class="bar" style="animation-delay: -0.2s"></div>
        <div class="bar" style="animation-delay: -0.6s"></div>
        <div class="bar" style="animation-delay: -0.1s"></div>
        <div class="bar" style="animation-delay: -0.3s"></div>
        <div class="bar" style="animation-delay: -0.5s"></div>
        <div class="bar" style="animation-delay: -0.2s"></div>
        <div class="bar" style="animation-delay: -0.4s"></div>
      </div>

      <div class="track-info">
        <div class="track-artist" id="playerSubtitle"></div>
        <!-- Surah Selection -->
      <div style="h" class="surah-selection">
          <div class="dropdown-container">
              <button class="compact-dropdown-btn" id="surahDropdownBtn" title="اختر السورة">
                  <i class="bi bi-book"></i>
                  <span id="currentSurahDisplay">اختر سورة</span>
                  <i class="bi bi-chevron-down"></i>
              </button>
              <div class="compact-dropdown-menu" id="surahDropdown">
                  <div class="dropdown-search">
                      <input type="text" placeholder="ابحث عن سورة..." id="surahSearch">
                  </div>
                  <div class="dropdown-list" id="surahList">
                      <!-- Surahs will be populated here -->
                  </div>
              </div>
          </div>
          
          <button class="mini-player-btn download-btn" id="downloadBtn" title="تحميل">
          <i class="bi bi-download"></i>
        </button>
        
      </div>

       
      </div>

      <div  class="progress-container">
        <div class="progress-bar" id="progressBar">
          <div class="progress" id="progressFill"></div>
        </div>
       

         <div class="time-info">
          <span class="current-time-small" id="currentTimeDisplay">00:00:00</span>
          <span class="total-time-small" id="totalTimeDisplay">00:00:00</span>
        </div>


      </div>

        
        
      <div class="controls">
        <button class="mini-player-btn" id="prevBtn">
          <i class="bi bi-skip-backward"></i>
        </button>
        <button class="mini-player-btn play-pause" id="playIcon">
          <i class="bi bi-play-fill"></i>
        </button>
        <button class="mini-player-btn" id="nextBtn">
          <i class="bi bi-skip-forward"></i>
        </button>
      </div>

      

    


      <!-- Reciter Gallery - Album Style -->
      <div class="reciter-gallery">
          <div class="reciter-grid" id="reciterGrid">
              <!-- Reciters will be populated here -->
          </div>
      </div>
    </div>
  </div>
</div>



            </div>
        `;

        document.body.appendChild(playerContainer);
    }

    setupEventListeners() {
        // Progress bar is now non-clickable - removed click handler

        // Volume control removed - no longer needed

        // Mini player controls
        document.getElementById('miniPlayBtn').addEventListener('click', () => {
            this.togglePlayPause();
        });

        document.getElementById('expandBtn').addEventListener('click', () => {
            this.toggleExpanded();
        });

        // Full player controls
        document.getElementById('playIcon').addEventListener('click', () => {
            this.togglePlayPause();
        });

        document.getElementById('prevBtn').addEventListener('click', () => {
            this.previousAyah();
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            this.nextAyah();
        });

        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadAyah();
        });







        // Compact dropdowns setup
        this.setupCompactDropdowns();

        // Mini player click
        document.getElementById('miniPlayer').addEventListener('click', (e) => {
            if (!e.target.closest('.mini-player-btn')) {
                this.toggleExpanded();
            }
        });

        // Volume slider removed - no longer needed
    }

    setupAudioEvents() {
        this.audio.addEventListener('timeupdate', () => {
            this.updateProgress();
        });

        this.audio.addEventListener('ended', () => {
            // End of current surah, go to next surah
            const currentSurahIndex = this.surahs.findIndex(s => s.number === this.currentSurah.number);
            if (currentSurahIndex < this.surahs.length - 1) {
                this.showNotification('جاري الانتقال للسورة التالية...', 'info');
                setTimeout(() => {
                    this.loadSurah(currentSurahIndex + 1);
                }, 1000);
            } else {
                // End of all surahs
                this.showNotification('انتهت جميع السور', 'info');
                this.isPlaying = false;
                this.updatePlayButton();
                this.updateFloatingButtonState();
                this.hidePlayer();
            }
        });

        this.audio.addEventListener('loadedmetadata', () => {
            this.updateTotalTime();
        });

        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayButton();
            this.updateFloatingButtonState();
            this.showPlayer();
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayButton();
            this.updateFloatingButtonState();
        });

        this.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.showNotification('خطأ في تحميل الملف الصوتي', 'error');
            this.updateFloatingButtonState();
            this.hidePlayer();
        });

        // Set default volume
        this.audio.volume = 0.7;
    }

    // Surahs are now static, no need to load from API
    async loadSurahs() {
        this.updateCurrentSurahDisplay();
        await this.loadLastSurahOrDefault();
    }

    async loadLastSurahOrDefault() {
        // Always default to Al-Fatiha (index 0) with Mishary Alafasy
        if (this.surahs && this.surahs.length > 0) {
            this.currentSurah = this.surahs[0]; // Al-Fatiha
            this.currentAyah = 0;
            this.currentSurahIndex = 0;
            this.currentReciter = 'ar.alafasy'; // Mishary Alafasy
            this.updatePlayerInfo(this.currentSurah);
            this.updateCurrentSurahDisplay();
            this.updateReciterImage();
            this.updateSurahCounter();

            // Load the surah but don't play it (paused state)
            await this.loadSurahForReadyState();
        }
    }

    // Load surah for ready state (paused)
    async loadSurahForReadyState() {
        if (!this.currentSurah) return Promise.resolve();

        try {
            // Show loading state
            this.showNotification('جاري تحميل سورة الفاتحة...', 'info');

            // Load surah data
            const [arabicRes, englishRes] = await Promise.all([
                fetch(`https://api.alquran.cloud/v1/surah/${this.currentSurah.number}`),
                fetch(`https://api.alquran.cloud/v1/surah/${this.currentSurah.number}/en.pickthall`)
            ]);

            const [arabicData, englishData] = await Promise.all([
                arabicRes.json(),
                englishRes.json()
            ]);

            // Create playlist with full surah audio URL
            this.playlist = [{
                number: 1,
                arabic: this.currentSurah.name,
                english: this.currentSurah.englishName,
                audio: `https://cdn.islamic.network/quran/audio-surah/128/${this.currentReciter}/${this.currentSurah.number}.mp3`
            }];

            // Set current ayah to 0 to start from beginning
            this.currentAyah = 0;

            // Load audio but don't play it
            if (this.playlist.length > 0) {
                this.loadAudioForReadyState();
            }

            this.showNotification(`تم تحميل ${this.currentSurah.name} - جاهز للعب`, 'success');
            this.updateFloatingButtonState();

            return Promise.resolve();

        } catch (error) {
            console.error('Error loading surah for ready state:', error);
            this.showNotification('خطأ في تحميل السورة', 'error');
            this.updateFloatingButtonState();
            return Promise.reject(error);
        }
    }

    // Load audio for ready state (paused)
    loadAudioForReadyState() {
        if (!this.playlist[0] || !this.playlist[0].audio) {
            this.showNotification('لا يوجد ملف صوتي للسورة', 'error');
            this.updateFloatingButtonState();
            return;
        }

        this.currentAyah = 0; // Always start from beginning of surah
        const surah = this.playlist[0];

        // Show player when ready
        this.showPlayer();

        // Update audio source
        this.audio.src = surah.audio;

        // Add event listener for when audio is loaded
        this.audio.addEventListener('loadedmetadata', () => {
            this.updateTotalTime();
            // Pause the audio immediately after loading
            this.audio.pause();
            this.isPlaying = false;
            this.updatePlayButton();
        }, { once: true });

        // Update UI
        this.updateCurrentSurahInfo(surah);
        this.updateFloatingButtonState();
        this.updateReciterImage();
    }

    async loadSurah(index) {
        const surah = this.surahs[index];
        if (!surah) return;

        this.currentSurah = surah;
        this.currentAyah = 0;
        this.currentSurahIndex = index;

        // Update UI
        this.updatePlayerInfo(surah);
        this.updateFloatingButtonState();
        this.updateCurrentSurahDisplay();
        this.updateReciterImage();

        try {
            // Show loading state
            this.showNotification('جاري تحميل السورة...', 'info');

            // Load surah data
            const [arabicRes, englishRes] = await Promise.all([
                fetch(`https://api.alquran.cloud/v1/surah/${surah.number}`),
                fetch(`https://api.alquran.cloud/v1/surah/${surah.number}/en.pickthall`)
            ]);

            const [arabicData, englishData] = await Promise.all([
                arabicRes.json(),
                englishRes.json()
            ]);

            // Create playlist with full surah audio URL
            this.playlist = [{
                number: 1,
                arabic: surah.name,
                english: surah.englishName,
                audio: `https://cdn.islamic.network/quran/audio-surah/128/${this.currentReciter}/${surah.number}.mp3`
            }];

            // Set current ayah to 0 to start from beginning
            this.currentAyah = 0;

            // Play the full surah
            if (this.playlist.length > 0) {
                this.playAyah(0);
            }

            this.showNotification(`تم تحميل ${surah.name}`, 'success');
            this.updateFloatingButtonState();

        } catch (error) {
            console.error('Error loading surah:', error);
            this.showNotification('خطأ في تحميل السورة', 'error');
            this.updateFloatingButtonState();
        }
    }

    playAyah(index) {
        // If no playlist exists, load the current surah first
        if (!this.playlist || this.playlist.length === 0) {
            this.loadSurahForReadyState().then(() => {
                // After loading, try to play again
                if (this.playlist && this.playlist.length > 0) {
                    this.playAyah(index);
                }
            });
            return;
        }

        if (!this.playlist[0] || !this.playlist[0].audio) {
            this.showNotification('لا يوجد ملف صوتي للسورة', 'error');
            this.updateFloatingButtonState();
            return;
        }

        this.currentAyah = 0; // Always play from beginning of surah
        const surah = this.playlist[0];

        // Show player when starting to play
        this.showPlayer();

        // Update audio source
        this.audio.src = surah.audio;

        // Add event listener for when audio is loaded
        this.audio.addEventListener('loadedmetadata', () => {
            this.updateTotalTime();
        }, { once: true });

        this.audio.play().catch(error => {
            console.error('Error playing audio:', error);
            this.showNotification('خطأ في تشغيل الملف الصوتي', 'error');
            this.updateFloatingButtonState();
        });

        // Update UI
        this.updateCurrentSurahInfo(surah);
        this.updateFloatingButtonState();
        this.updateReciterImage();
    }

    togglePlayPause() {
        if (!this.currentSurah) {
            this.showNotification('يرجى اختيار سورة أولاً', 'info');
            this.updateFloatingButtonState();
            return;
        }

        if (this.audio.paused) {
            if (this.currentAyah === 0 && !this.audio.src) {
                this.playAyah(0);
            } else {
                this.showPlayer();
                this.audio.play();
            }
        } else {
            this.audio.pause();
        }
    }

    nextAyah() {
        // Go to next surah since we're playing full surahs
        const currentSurahIndex = this.surahs.findIndex(s => s.number === this.currentSurah.number);
        if (currentSurahIndex < this.surahs.length - 1) {
            this.loadSurah(currentSurahIndex + 1);
        } else {
            this.showNotification('انتهت جميع السور', 'info');
            this.updateFloatingButtonState();
        }
    }

    previousAyah() {
        // Go to previous surah since we're playing full surahs
        const currentSurahIndex = this.surahs.findIndex(s => s.number === this.currentSurah.number);
        if (currentSurahIndex > 0) {
            this.loadSurah(currentSurahIndex - 1);
        } else {
            this.showNotification('أنت في أول سورة', 'info');
        }
    }

    seekTo(percent) {
        if (this.audio.duration) {
            this.audio.currentTime = this.audio.duration * percent;
        }
    }

    rewind10Seconds() {
        if (this.audio.duration) {
            this.audio.currentTime = Math.max(0, this.audio.currentTime - 10);
            this.showNotification('رجوع 10 ثواني', 'info');
        }
    }

    forward10Seconds() {
        if (this.audio.duration) {
            this.audio.currentTime = Math.min(this.audio.duration, this.audio.currentTime + 10);
            this.showNotification('تقديم 10 ثواني', 'info');
        }
    }

    // Volume functions removed - no longer needed

    setPlaybackRate(rate) {
        this.playbackRate = rate;
        this.audio.playbackRate = rate;
        this.saveSettings();
    }

    setReciter(reciter) {
        console.log('Setting reciter to:', reciter);
        this.currentReciter = reciter;
        this.saveSettings();

        // Update image immediately
        this.updateReciterImage();

        // Also update after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.updateReciterImage();
        }, 100);

        if (this.currentSurah) {
            this.loadSurah(this.surahs.findIndex(s => s.number === this.currentSurah.number));
        }
    }

    updateReciterImage() {
        const albumArtImg = document.querySelector('.album-art img');
        const miniReciterImage = document.getElementById('miniReciterImage');
        const miniDefaultIcon = document.getElementById('miniDefaultIcon');

        console.log('Updating reciter image for:', this.currentReciter);
        console.log('Available reciter images:', this.reciterImages);

        // Update main player image
        if (albumArtImg && this.reciterImages[this.currentReciter]) {
            const imageUrl = this.reciterImages[this.currentReciter];
            console.log('Setting main player image:', imageUrl);
            albumArtImg.src = imageUrl;
            albumArtImg.alt = this.getReciterName(this.currentReciter);
        } else {
            console.warn('Main player image not found or no image for reciter:', this.currentReciter);
        }

        // Update mini player image
        if (miniReciterImage && miniDefaultIcon) {
            if (this.reciterImages[this.currentReciter]) {
                const imageUrl = this.reciterImages[this.currentReciter];
                console.log('Setting mini player image:', imageUrl);

                // Reset classes first
                miniReciterImage.classList.remove('active');
                miniDefaultIcon.classList.add('active');

                // Set new image
                miniReciterImage.src = imageUrl;
                miniReciterImage.alt = this.getReciterName(this.currentReciter);

                // Handle image load success
                miniReciterImage.onload = () => {
                    console.log('Mini player image loaded successfully');
                    miniReciterImage.classList.add('active');
                    miniDefaultIcon.classList.remove('active');
                };

                // Handle image load error
                miniReciterImage.onerror = () => {
                    console.warn('Failed to load reciter image:', imageUrl);
                    miniReciterImage.classList.remove('active');
                    miniDefaultIcon.classList.add('active');
                };

                // If image is already loaded
                if (miniReciterImage.complete && miniReciterImage.naturalHeight !== 0) {
                    console.log('Mini player image already loaded');
                    miniReciterImage.classList.add('active');
                    miniDefaultIcon.classList.remove('active');
                }
            } else {
                console.log('No reciter image found for:', this.currentReciter);
                miniReciterImage.classList.remove('active');
                miniDefaultIcon.classList.add('active'); // Show default icon when no reciter image
            }
        } else {
            console.warn('Mini player elements not found:', { miniReciterImage, miniDefaultIcon });
        }
    }

    getReciterName(reciterCode) {
        const reciterNames = {
            'ar.alafasy': 'مشاري العفاسي',
            'ar.yasseraldossari': 'ياسر الدوسري',

            'ar.abdulbasitmurattal': 'عبد الباسط عبد الصمد (مرتل)',
            'ar.abdulbasitmujawwad': 'عبد الباسط عبد الصمد (مجود)',

            'ar.ahmedalajmi': 'أحمد العجمي',
            'ar.muhammadayyub': 'محمد أيوب',
            'ar.abdulazizazzahrani': 'عبد العزيز الزهراني',
            'ar.muhammadsiddiqalminshawimujawwad': 'محمد صديق المنشاوي (مجود)',
            'ar.mustafaismail': 'مصطفي اسماعيل',

            // New reciters
            'ar.abdullahalmatrood': 'عبد الله المطرود',
            'ar.abdullahawadaljuhani': 'عبد الله عواد الجهني',
            'ar.abdullahbasfar': 'عبد الله بصفر',
            'ar.abdullahkhayat': 'عبد الله خياط',
            'ar.abdullahkhulaifi': 'عبد الله خليفي',
            'ar.abdulmohsenalharthy': 'عبد المحسن الحارثي',
            'ar.abdulmuhsinalqasim': 'عبد المحسن القاسم',
            'ar.abdulmunimabdulmubdi': 'عبد المنعم عبد المبدي',
            'ar.abdulwadoodhaneef': 'عبد الودود حنيف',
            'ar.abdurrasheedsufiabialhaarithanalkasaaee': 'عبد الرشيد الصوفي [أبي الحارث عن الكسائي]',
            'ar.abdurrasheedsufiaddoorianabiamr': 'عبد الرشيد الصوفي [الدوري عن أبي عمرو]',
            'ar.abdurrasheedsufishubahanasim': 'عبد الرشيد الصوفي [شعبة عن عاصم]',
            'ar.abdurrasheedsufisoosi': 'عبد الرشيد الصوفي [السوسي]',
            'ar.abdurrazaqbinabtanaldulaimi': 'عبد الرزاق بن أبتان الدليمي',
            'ar.abuabdullahmuniraltounsi': 'أبو عبد الله منير التونسي',
            'ar.abubakraldhabi': 'أبو بكر الذهبي',

            // Additional reciters
            'ar.adilkalbani': 'عادل كالبياني',
            'ar.ahmadalhawashy': 'أحمد الحواشي',
            'ar.ahmadalnufais': 'أحمد النفيس',
            'ar.ahmadkhaderaltarabulsi': 'أحمد خضر الطرابلسي',
            'ar.ahmadsulaiman': 'أحمد سليمان',
            'ar.ahmedalhammad': 'أحمد الحماد',
            'ar.ahmedalmisbahi': 'أحمد المصباحي',
            'ar.ahmedamir': 'أحمد أمير',
            'ar.ahmedmohamedsalama': 'أحمد محمد سلامة',
            'ar.ahmedsaber': 'أحمد صابر',
            'ar.alashryomran': 'الأشري عمران'
        };
        return reciterNames[reciterCode] || ' ';
    }


    toggleExpanded() {
        const container = document.getElementById('quranPlayerContainer');
        const fullPlayer = document.getElementById('fullPlayer');
        const expandIcon = document.getElementById('expandIcon');

        this.isExpanded = !this.isExpanded;

        if (this.isExpanded) {
            // Show full player but keep mini player visible
            container.classList.add('active', 'show');
            container.classList.remove('hide');
            fullPlayer.style.display = 'block';
            expandIcon.className = 'bi bi-chevron-down';
            this.updateFloatingButtonState();

            // Add body padding on mobile when player is expanded
            if (window.innerWidth <= 768) {
                document.body.classList.add('player-active');
            }
        } else {
            // Hide full player but keep mini player visible
            container.classList.remove('active');
            fullPlayer.style.display = 'none';
            expandIcon.className = 'bi bi-chevron-up';

            // Remove body padding on mobile
            document.body.classList.remove('player-active');

            // Always keep container and mini player visible
            container.classList.add('show');
            container.classList.remove('hide');
            this.updateFloatingButtonState();
        }
    }

    updatePlayerInfo(surah) {
        const miniTitle = document.getElementById('miniTitle');
        const miniSubtitle = document.getElementById('miniSubtitle');
        const playerSubtitle = document.getElementById('playerSubtitle');
        const trackTitle = document.querySelector('.track-title');

        miniTitle.textContent = surah.name;
        const subtitleSpan = miniSubtitle.querySelector('span');
        if (subtitleSpan) {
            subtitleSpan.textContent = '';
        } else {
            miniSubtitle.textContent = '';
        }
        playerSubtitle.textContent = '';

        // Update surah name in the new player
        if (trackTitle) {
            trackTitle.textContent = surah.name;
        }
    }

    updateCurrentAyahInfo(ayah) {
        const miniSubtitle = document.getElementById('miniSubtitle');
        const playerSubtitle = document.getElementById('playerSubtitle');
        const trackArtist = document.querySelector('.track-artist');

        const subtitleSpan = miniSubtitle.querySelector('span');
        if (subtitleSpan) {
            subtitleSpan.textContent = `الآية ${ayah.number}`;
        } else {
            miniSubtitle.textContent = `الآية ${ayah.number}`;
        }
        playerSubtitle.textContent = `الآية ${ayah.number}`;

        // Update reciter name in the new player
        if (trackArtist) {
            trackArtist.textContent = this.getReciterName(this.currentReciter);
        }
    }

    updateCurrentSurahInfo(surah) {
        const miniSubtitle = document.getElementById('miniSubtitle');
        const playerSubtitle = document.getElementById('playerSubtitle');
        const trackArtist = document.querySelector('.track-artist');

        const reciterName = this.getReciterName(this.currentReciter);
        const subtitleSpan = miniSubtitle.querySelector('span');
        if (subtitleSpan) {
            subtitleSpan.textContent = reciterName;
        } else {
            miniSubtitle.textContent = reciterName;
        }
        playerSubtitle.textContent = reciterName;

        // Update reciter name in the new player
        if (trackArtist) {
            trackArtist.textContent = reciterName;
        }

    }

    updateProgress() {
        if (!this.audio.duration) return;

        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        const progressFill = document.getElementById('progressFill');
        const currentTime = document.getElementById('currentTime');
        const currentTimeDisplay = document.getElementById('currentTimeDisplay');

        progressFill.style.width = progress + '%';
        if (currentTime) {
            currentTime.textContent = this.formatTime(this.audio.currentTime);
        }

        // Update progress timer
        if (currentTimeDisplay) {
            currentTimeDisplay.textContent = this.formatTime(this.audio.currentTime);
            console.log('Current time display updated:', this.formatTime(this.audio.currentTime));
        }

        // Also update total time if not already set
        this.updateTotalTime();
    }

    updateTotalTime() {
        const totalTime = document.getElementById('totalTime');
        const totalTimeDisplay = document.getElementById('totalTimeDisplay');

        console.log('Updating total time:', this.audio.duration);

        if (totalTime) {
            totalTime.textContent = this.formatTime(this.audio.duration);
        }

        // Update progress timer
        if (totalTimeDisplay) {
            totalTimeDisplay.textContent = this.formatTime(this.audio.duration);
            console.log('Total time display updated:', this.formatTime(this.audio.duration));
        }
    }

    updatePlayButton() {
        const playIcon = document.getElementById('playIcon');
        const miniPlayIcon = document.getElementById('miniPlayIcon');
        const container = document.getElementById('quranPlayerContainer');
        const albumArt = document.querySelector('.album-art');
        const visualizer = document.querySelector('.visualizer');
        const miniVisualizer = document.getElementById('miniVisualizer');

        if (this.isPlaying) {
            if (playIcon) {
                const icon = playIcon.querySelector('i');
                if (icon) icon.className = 'bi bi-pause-fill';
            }
            if (miniPlayIcon) {
                miniPlayIcon.className = 'bi bi-pause-circle-fill';
            }
            if (container) {
                container.classList.add('playing');
            }
            if (albumArt) {
                albumArt.classList.remove('stopping');
                albumArt.classList.add('playing');
            }
            if (visualizer) {
                visualizer.classList.add('playing');
            }
            if (miniVisualizer) {
                miniVisualizer.classList.add('playing');
                miniVisualizer.style.display = 'flex';
            }
        } else {
            if (playIcon) {
                const icon = playIcon.querySelector('i');
                if (icon) icon.className = 'bi bi-play-fill';
            }
            if (miniPlayIcon) {
                miniPlayIcon.className = 'bi bi-play-circle-fill';
            }
            if (container) {
                container.classList.remove('playing');
            }
            if (albumArt) {
                albumArt.classList.remove('playing');
                albumArt.classList.add('stopping');

                // Remove stopping class after animation completes
                setTimeout(() => {
                    albumArt.classList.remove('stopping');
                }, 2000);
            }
            if (visualizer) {
                visualizer.classList.remove('playing');
            }
            if (miniVisualizer) {
                miniVisualizer.classList.remove('playing');
                miniVisualizer.style.display = 'none';
            }
        }
    }



    markActiveAyah(index) {
        // This would be used if we had individual ayah items in the playlist
        // For now, we'll just update the current ayah display
    }

    scrollToActiveAyah(index) {
        // Scroll to active ayah if we had a detailed ayah list
    }

    toggleFavorite() {
        if (!this.currentSurah) {
            this.updateFloatingButtonState();
            return;
        }

        const favorite = {
            surahNumber: this.currentSurah.number,
            surahName: this.currentSurah.name,
            timestamp: new Date().toISOString()
        };

        let favorites = JSON.parse(localStorage.getItem('quran-favorites') || '[]');
        const existingIndex = favorites.findIndex(f =>
            f.surahNumber === favorite.surahNumber
        );

        if (existingIndex !== -1) {
            favorites.splice(existingIndex, 1);
            this.showNotification('تم إزالة من المفضلة', 'info');
        } else {
            favorites.push(favorite);
            this.showNotification('تم إضافة للمفضلة', 'success');
        }

        localStorage.setItem('quran-favorites', JSON.stringify(favorites));
        this.updateFavoriteIcon();
    }

    updateFavoriteIcon() {
        if (!this.currentSurah) {
            this.updateFloatingButtonState();
            return;
        }

        const favoriteIcon = document.getElementById('favoriteIcon');
        const favoriteBtn = document.querySelector('.favorite-btn');
        const favorites = JSON.parse(localStorage.getItem('quran-favorites') || '[]');
        const isFavorite = favorites.some(f =>
            f.surahNumber === this.currentSurah.number
        );

        if (favoriteIcon) {
            favoriteIcon.className = isFavorite ? 'bi bi-heart-fill' : 'bi bi-heart';
        }
        if (favoriteBtn) {
            favoriteBtn.classList.toggle('active', isFavorite);
        }
    }

    downloadAyah() {
        if (!this.currentSurah || !this.playlist[0]) {
            this.showNotification('لا توجد سورة للتحميل', 'warning');
            return;
        }

        const surah = this.playlist[0];
        const audioUrl = surah.audio;

        if (!audioUrl) {
            this.showNotification('رابط التحميل غير متوفر', 'error');
            return;
        }

        // Create a temporary link element to trigger download
        const link = document.createElement('a');
        link.href = audioUrl;
        link.download = `سورة_${this.currentSurah.name}.mp3`;
        link.target = '_blank';

        // Add to DOM, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showNotification('جاري تحميل السورة...', 'success');
    }

    // Share function removed - no longer needed

    // Fallback copy function removed - no longer needed

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `player-notification ${type}`;
        notification.innerHTML = `
            <i class="bi ${type === 'success' ? 'bi-check-circle' : type === 'error' ? 'bi-exclamation-circle' : type === 'warning' ? 'bi-exclamation-triangle' : 'bi-info-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) {
            this.updateFloatingButtonState();
            return '00:00:00';
        }
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    loadSettings() {
        const savedSpeed = localStorage.getItem('quran-speed');
        const savedReciter = localStorage.getItem('quran-reciter');

        // Always set Mishary Alafasy as default
        this.currentReciter = 'ar.alafasy';
        const reciterSelect = document.getElementById('reciterSelect');
        if (reciterSelect) {
            reciterSelect.value = 'ar.alafasy';
        }
        this.updateReciterImage();

        // Hide floating button initially
        this.updateFloatingButtonState();

        // Hide player container initially
        const container = document.getElementById('quranPlayerContainer');
        if (container) {
            container.classList.add('hide');
            container.classList.remove('show', 'active');
        }

        // Update reciter image on initial load
        this.updateReciterImage();
    }

    saveSettings() {
        localStorage.setItem('quran-speed', this.playbackRate);
        localStorage.setItem('quran-reciter', 'ar.alafasy');

        // Save last played surah
        if (this.currentSurah) {
            const surahIndex = this.surahs.findIndex(s => s.number === this.currentSurah.number);
            if (surahIndex !== -1) {
                localStorage.setItem('quran-last-surah', surahIndex);
            }
        }

        // Hide floating button if no surah is loaded
        if (!this.currentSurah) {
            this.updateFloatingButtonState();
        }
    }

    // Public methods for external access
    playSurah(surahIndex) {
        this.loadSurah(surahIndex);
        this.updateFloatingButtonState();
    }

    getCurrentSurah() {
        return this.currentSurah;
    }

    isCurrentlyPlaying() {
        return this.isPlaying;
    }

    showPlayer() {
        const container = document.getElementById('quranPlayerContainer');
        if (container) {
            container.style.display = 'block';
            container.classList.remove('hide');
            container.classList.add('show');

            // Add body padding on mobile when player is shown
            if (window.innerWidth <= 768) {
                document.body.classList.add('player-active');
            }
        }
    }

    hidePlayer() {
        const container = document.getElementById('quranPlayerContainer');
        if (container) {
            container.classList.remove('show');
            container.classList.add('hide');

            // Remove body padding on mobile
            document.body.classList.remove('player-active');

            // Hide container after animation
            setTimeout(() => {
                if (!container.classList.contains('show')) {
                    container.style.display = 'none';
                }
            }, 400);
        }
    }

    showFloatingButton() {
        const floatingBtn = document.getElementById('floatingPlayerBtn');
        if (floatingBtn) {
            floatingBtn.classList.add('show');
            if (this.currentSurah && this.isPlaying) {
                floatingBtn.classList.add('playing');
            }
        }
    }

    hideFloatingButton() {
        const floatingBtn = document.getElementById('floatingPlayerBtn');
        if (floatingBtn) {
            floatingBtn.classList.remove('show', 'playing');
        }
    }

    updateFloatingButtonState() {
        const floatingBtn = document.getElementById('floatingPlayerBtn');
        if (floatingBtn) {
            // Always show the floating button, but only add 'playing' class when actually playing
            floatingBtn.classList.add('show');
            if (this.currentSurah && this.isPlaying) {
                floatingBtn.classList.add('playing');
            } else {
                floatingBtn.classList.remove('playing');
            }
        }
    }

    ensurePlayerVisible() {
        const container = document.getElementById('quranPlayerContainer');
        if (container) {
            container.style.display = 'block';
            container.classList.remove('hide');
            container.classList.add('show');
        }
    }

    setupCompactDropdowns() {
        // Surah dropdown
        const surahDropdownBtn = document.getElementById('surahDropdownBtn');
        const surahDropdown = document.getElementById('surahDropdown');
        const surahSearch = document.getElementById('surahSearch');
        const surahList = document.getElementById('surahList');

        // Toggle surah dropdown
        surahDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown('surah');
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            this.closeAllDropdowns();
        });

        // Prevent dropdown from closing when clicking inside
        surahDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Search functionality for surahs
        surahSearch.addEventListener('input', (e) => {
            this.filterSurahs(e.target.value);
        });

        // Allow all keyboard input including spaces and backspace
        surahSearch.addEventListener('keydown', (e) => {
            // Allow all keys including space, backspace, delete, arrows, etc.
            e.stopPropagation();

            // Handle special keys
            if (e.key === 'Enter') {
                e.preventDefault();
                // Select first visible item if any
                const visibleItems = surahList.querySelectorAll('.dropdown-item[style*="flex"]');
                if (visibleItems.length > 0) {
                    visibleItems[0].click();
                }
            }
        });

        // Handle keyup for better responsiveness
        surahSearch.addEventListener('keyup', (e) => {
            this.filterSurahs(e.target.value);
        });

        // Handle paste events
        surahSearch.addEventListener('paste', (e) => {
            setTimeout(() => {
                this.filterSurahs(e.target.value);
            }, 10);
        });

        // Handle cut events
        surahSearch.addEventListener('cut', (e) => {
            setTimeout(() => {
                this.filterSurahs(e.target.value);
            }, 10);
        });

        // Populate reciter gallery
        this.populateReciterGallery();
    }

    toggleDropdown(type) {
        const surahDropdown = document.getElementById('surahDropdown');
        const surahBtn = document.getElementById('surahDropdownBtn');

        if (type === 'surah') {
            const isOpen = surahDropdown.classList.contains('show');
            this.closeAllDropdowns();
            if (!isOpen) {
                surahDropdown.classList.add('show');
                surahBtn.classList.add('active');
                this.populateSurahDropdown();
            }
        }
    }

    closeAllDropdowns() {
        const surahDropdown = document.getElementById('surahDropdown');
        const surahBtn = document.getElementById('surahDropdownBtn');

        surahDropdown.classList.remove('show');
        surahBtn.classList.remove('active');
    }

    populateSurahDropdown() {
        const surahList = document.getElementById('surahList');
        if (!surahList || !this.surahs) return;

        surahList.innerHTML = '';

        this.surahs.forEach((surah, index) => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.dataset.surahId = surah.id;
            item.dataset.surahNumber = surah.number;

            if (this.currentSurah && surah.number === this.currentSurah.number) {
                item.classList.add('active');
            }

            item.innerHTML = `
                <i class="bi bi-book"></i>
                <span>سورة ${surah.name}</span>
                <span class="item-number">${surah.numberOfAyahs} آية</span>
            `;

            item.addEventListener('click', () => {
                this.loadSurah(index);
                this.closeAllDropdowns();
                this.updateCurrentSurahDisplay();
            });

            surahList.appendChild(item);
        });
    }

    populateReciterGallery() {
        const reciterGrid = document.getElementById('reciterGrid');
        if (!reciterGrid) return;

        const allReciters = [
            { value: 'ar.alafasy', name: 'مشاري العفاسي', image: 'media/images/afasy.jpg' },
            { value: 'ar.yasseraldossari', name: 'ياسر الدوسري', image: 'media/images/dosary.jpg' },
            { value: 'ar.abdulbasitmurattal', name: 'عبد الباسط عبد الصمد (مرتل)', image: 'media/images/abdelbaset.jpg' },
            { value: 'ar.abdulbasitmujawwad', name: 'عبد الباسط عبد الصمد (مجود)', image: 'media/images/abdelbaset.jpg' },
            { value: 'ar.ahmedalajmi', name: 'احمد العجمي', image: 'media/images/ahmedajamy.jpg' },
            { value: 'ar.muhammadayyub', name: 'محمد أيوب', image: 'media/images/ayoub.jpg' },
            { value: 'ar.abdulazizazzahrani', name: 'عبد العزيز الزهراني', image: 'media/images/zahrany.jpg' },
            { value: 'ar.muhammadsiddiqalminshawimujawwad', name: 'محمد صديق المنشاوي (مجود)', image: 'media/images/menshawy.jpg' },
            { value: 'ar.mustafaismail', name: 'مصطفي اسماعيل', image: 'media/images/m_ismaiel.jpg' },
            { value: 'ar.abdullahalmatrood', name: 'عبد الله المطرود', image: 'media/images/logo.jpg' },
            { value: 'ar.abdullahawadaljuhani', name: 'عبد الله عواد الجهني', image: 'media/images/logo.jpg' },
            { value: 'ar.abdullahbasfar', name: 'عبد الله بصفر', image: 'media/images/logo.jpg' },
            { value: 'ar.abdullahkhayat', name: 'عبد الله خياط', image: 'media/images/logo.jpg' },
            { value: 'ar.abdullahkhulaifi', name: 'عبد الله خليفي', image: 'media/images/logo.jpg' },
            { value: 'ar.abdulmohsenalharthy', name: 'عبد المحسن الحارثي', image: 'media/images/logo.jpg' },
            { value: 'ar.abdulmuhsinalqasim', name: 'عبد المحسن القاسم', image: 'media/images/logo.jpg' },
            { value: 'ar.abdulmunimabdulmubdi', name: 'عبد المنعم عبد المبدي', image: 'media/images/logo.jpg' },
            { value: 'ar.abdulwadoodhaneef', name: 'عبد الودود حنيف', image: 'media/images/logo.jpg' },
            { value: 'ar.abdurrasheedsufiabialhaarithanalkasaaee', name: 'عبد الرشيد الصوفي [أبي الحارث عن الكسائي]', image: 'media/images/logo.jpg' },
            { value: 'ar.abdurrasheedsufiaddoorianabiamr', name: 'عبد الرشيد الصوفي [الدوري عن أبي عمرو]', image: 'media/images/logo.jpg' },
            { value: 'ar.abdurrasheedsufishubahanasim', name: 'عبد الرشيد الصوفي [شعبة عن عاصم]', image: 'media/images/logo.jpg' },
            { value: 'ar.abdurrasheedsufisoosi', name: 'عبد الرشيد الصوفي [السوسي]', image: 'media/images/logo.jpg' },
            { value: 'ar.abdurrazaqbinabtanaldulaimi', name: 'عبد الرزاق بن أبتان الدليمي', image: 'media/images/logo.jpg' },
            { value: 'ar.abuabdullahmuniraltounsi', name: 'أبو عبد الله منير التونسي', image: 'media/images/logo.jpg' },
            { value: 'ar.abubakraldhabi', name: 'أبو بكر الذهبي', image: 'media/images/logo.jpg' },
            { value: 'ar.adilkalbani', name: 'عادل كالبياني', image: 'media/images/logo.jpg' },
            { value: 'ar.ahmadalhawashy', name: 'أحمد الحواشي', image: 'media/images/logo.jpg' },
            { value: 'ar.ahmadalnufais', name: 'أحمد النفيس', image: 'media/images/logo.jpg' },
            { value: 'ar.ahmadkhaderaltarabulsi', name: 'أحمد خضر الطرابلسي', image: 'media/images/logo.jpg' },
            { value: 'ar.ahmadsulaiman', name: 'أحمد سليمان', image: 'media/images/logo.jpg' },
            { value: 'ar.ahmedalhammad', name: 'أحمد الحماد', image: 'media/images/logo.jpg' },
            { value: 'ar.ahmedalmisbahi', name: 'أحمد المصباحي', image: 'media/images/logo.jpg' },
            { value: 'ar.ahmedamir', name: 'أحمد أمير', image: 'media/images/logo.jpg' },
            { value: 'ar.ahmedmohamedsalama', name: 'أحمد محمد سلامة', image: 'media/images/logo.jpg' },
            { value: 'ar.ahmedsaber', name: 'أحمد صابر', image: 'media/images/logo.jpg' },
            { value: 'ar.alashryomran', name: 'الأشري عمران', image: 'media/images/logo.jpg' }
        ];

        // Show only first 6 reciters
        const displayedReciters = allReciters.slice(0, 6);

        reciterGrid.innerHTML = '';

        displayedReciters.forEach(reciter => {
            const card = document.createElement('div');
            card.className = 'reciter-card';
            if (this.currentReciter === reciter.value) {
                card.classList.add('active');
            }

            card.innerHTML = `
                <img src="${reciter.image}" alt="${reciter.name}" class="reciter-image" onerror="this.src='media/images/logo.jpg'">
                <p class="reciter-name">${reciter.name}</p>
            `;

            card.addEventListener('click', () => {
                this.setReciter(reciter.value);
                this.updateCurrentReciterDisplay();
                this.markActiveReciter(reciter.value);
            });

            reciterGrid.appendChild(card);
        });

        // Add "Show More" button
        const showMoreBtn = document.createElement('div');
        showMoreBtn.className = 'reciter-card show-more-btn';
        showMoreBtn.innerHTML = `
            <div class="show-more-content">
                <i class="bi bi-three-dots me-2"></i>
                <span>عرض ${allReciters.length - 6} قارئ آخرين</span>
            </div>
        `;

        showMoreBtn.addEventListener('click', () => {
            this.showAllRecitersModal(allReciters);
        });

        reciterGrid.appendChild(showMoreBtn);
    }

    showAllRecitersModal(allReciters) {
        // Create modal HTML
        const modalHTML = `
            <div class="reciter-modal-overlay" id="reciterModalOverlay">
                <div class="reciter-modal">
                    <div class="reciter-modal-header">
                        <h3>اختر القارئ</h3>
                        <button class="reciter-modal-close" id="reciterModalClose">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                    <div class="reciter-search-container">
                        <input type="text" id="reciterSearchInput" placeholder="ابحث عن قارئ..." class="reciter-search-input">
                        <i class="bi bi-search reciter-search-icon"></i>
                        <button class="reciter-clear-btn" id="reciterClearBtn" style="display: none;">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                    <div class="reciter-modal-body">
                        <div class="reciter-modal-grid" id="reciterModalGrid">
                            <!-- Reciters will be populated here -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('reciterModalOverlay');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById('reciterModalOverlay');
        const modalGrid = document.getElementById('reciterModalGrid');
        const searchInput = document.getElementById('reciterSearchInput');
        const closeBtn = document.getElementById('reciterModalClose');
        const clearBtn = document.getElementById('reciterClearBtn');

        // Populate reciters
        this.populateModalReciters(allReciters, modalGrid);

        // Search functionality
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            this.filterModalReciters(query, modalGrid, allReciters);

            // Show/hide clear button
            if (query.length > 0) {
                clearBtn.style.display = 'block';
            } else {
                clearBtn.style.display = 'none';
            }
        });

        // Clear search functionality
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            this.filterModalReciters('', modalGrid, allReciters);
            clearBtn.style.display = 'none';
            searchInput.focus();
        });

        // Clear search with Escape key
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                this.filterModalReciters('', modalGrid, allReciters);
                clearBtn.style.display = 'none';
                searchInput.focus();
            }
        });

        // Close modal events
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    populateModalReciters(reciters, container) {
        container.innerHTML = '';

        reciters.forEach(reciter => {
            const card = document.createElement('div');
            card.className = 'reciter-modal-card';
            if (this.currentReciter === reciter.value) {
                card.classList.add('active');
            }

            card.innerHTML = `
                <img src="${reciter.image}" alt="${reciter.name}" class="reciter-modal-image" onerror="this.src='media/images/logo.jpg'">
                <p class="reciter-modal-name">${reciter.name}</p>
            `;

            card.addEventListener('click', () => {
                this.setReciter(reciter.value);
                this.updateCurrentReciterDisplay();
                this.markActiveReciter(reciter.value);
                document.getElementById('reciterModalOverlay').remove();
            });

            container.appendChild(card);
        });
    }

    filterModalReciters(query, container, allReciters) {
        const filteredReciters = allReciters.filter(reciter =>
            reciter.name.toLowerCase().includes(query.toLowerCase())
        );
        this.populateModalReciters(filteredReciters, container);
    }

    markActiveReciter(reciterValue) {
        const cards = document.querySelectorAll('.reciter-card');
        cards.forEach(card => {
            if (card.querySelector('.reciter-name').textContent === this.getReciterName(reciterValue)) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }

    filterSurahs(query) {
        const surahList = document.getElementById('surahList');
        const items = surahList.querySelectorAll('.dropdown-item');

        // Clean and normalize query - allow spaces
        const cleanQuery = query.trim().replace(/\s+/g, ' '); // Normalize multiple spaces
        const normalizedQuery = this.removeDiacritics(cleanQuery.toLowerCase());

        items.forEach(item => {
            const surahName = item.querySelector('span').textContent;
            const normalizedSurahName = this.removeDiacritics(surahName.toLowerCase());

            // Check both normalized and original search
            const matchesNormalized = normalizedSurahName.includes(normalizedQuery);
            const matchesOriginal = surahName.toLowerCase().includes(cleanQuery.toLowerCase());

            if (matchesNormalized || matchesOriginal) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // Function to remove Arabic diacritics
    removeDiacritics(text) {
        return text
            .replace(/[\u064B-\u0652\u0670\u0640]/g, '') // Remove diacritics
            .replace(/[أإآ]/g, 'ا') // Normalize alef variations
            .replace(/[ة]/g, 'ه') // Normalize ta marbuta
            .replace(/[ي]/g, 'ى') // Normalize ya variations
            .trim();
    }

    updateCurrentSurahDisplay() {
        const currentSurahDisplay = document.getElementById('currentSurahDisplay');
        if (currentSurahDisplay && this.currentSurah) {
            currentSurahDisplay.textContent = `سورة ${this.currentSurah.name}`;
        }
    }

    updateCurrentReciterDisplay() {
        const currentReciterDisplay = document.getElementById('currentReciterDisplay');
        if (currentReciterDisplay) {
            const reciterName = this.getReciterName(this.currentReciter);
            currentReciterDisplay.textContent = reciterName;
        }
    }

    // Get surah by ID for API calls
    getSurahById(id) {
        return this.surahs.find(surah => surah.id === id);
    }

    // Get surah by number for API calls
    getSurahByNumber(number) {
        return this.surahs.find(surah => surah.number === number);
    }

    // Get all surahs (for external access)
    getAllSurahs() {
        return this.surahs;
    }

}

// Initialize player when DOM is loaded
let quranPlayer;
document.addEventListener('DOMContentLoaded', () => {
    quranPlayer = new SoundCloudQuranPlayer();

    // Ensure player is visible after initialization
    setTimeout(() => {
        if (quranPlayer) {
            quranPlayer.ensurePlayerVisible();
        }
    }, 2000);

    // Show floating button initially
    setTimeout(() => {
        if (quranPlayer) {
            quranPlayer.showFloatingButton();
        }
    }, 1000);

    // Show floating button on page load
    const floatingBtn = document.getElementById('floatingPlayerBtn');
    if (floatingBtn) {
        floatingBtn.classList.add('show');
    }

    // Hide floating button on window focus
    window.addEventListener('focus', () => {
        if (quranPlayer) {
            quranPlayer.updateFloatingButtonState();
        }
    });

    // Hide floating button on window blur
    window.addEventListener('blur', () => {
        if (quranPlayer) {
            quranPlayer.updateFloatingButtonState();
        }
    });

    // Update floating button on page visibility change
    document.addEventListener('visibilitychange', () => {
        if (quranPlayer) {
            quranPlayer.updateFloatingButtonState();
        }
    });

    // Hide floating button on resize and handle mobile positioning
    window.addEventListener('resize', () => {
        if (quranPlayer) {
            quranPlayer.updateFloatingButtonState();

            // Handle mobile positioning on resize
            const container = document.getElementById('quranPlayerContainer');
            if (container && container.classList.contains('show')) {
                if (window.innerWidth <= 768) {
                    document.body.classList.add('player-active');
                } else {
                    document.body.classList.remove('player-active');
                }
            }
        }
    });

    // Hide floating button on scroll
    window.addEventListener('scroll', () => {
        if (quranPlayer) {
            quranPlayer.updateFloatingButtonState();
        }
    });

    // Hide floating button on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.quran-player-container') &&
            !e.target.closest('.floating-player-btn') &&
            quranPlayer) {
            quranPlayer.updateFloatingButtonState();
        }
    });

    // Hide floating button on touch start
    document.addEventListener('touchstart', (e) => {
        if (!e.target.closest('.quran-player-container') &&
            !e.target.closest('.floating-player-btn') &&
            quranPlayer) {
            quranPlayer.updateFloatingButtonState();
        }
    });

    // Hide floating button on touch end
    document.addEventListener('touchend', (e) => {
        if (!e.target.closest('.quran-player-container') &&
            !e.target.closest('.floating-player-btn') &&
            quranPlayer) {
            quranPlayer.updateFloatingButtonState();
        }
    });

    // Hide floating button on touch move
    document.addEventListener('touchmove', (e) => {
        if (!e.target.closest('.quran-player-container') &&
            !e.target.closest('.floating-player-btn') &&
            quranPlayer) {
            quranPlayer.updateFloatingButtonState();
        }
    });

    // Hide floating button on touch cancel
    document.addEventListener('touchcancel', (e) => {
        if (!e.target.closest('.quran-player-container') &&
            !e.target.closest('.floating-player-btn') &&
            quranPlayer) {
            quranPlayer.updateFloatingButtonState();
        }
    });

    // Hide floating button on context menu
    document.addEventListener('contextmenu', (e) => {
        if (!e.target.closest('.quran-player-container') &&
            !e.target.closest('.floating-player-btn') &&
            quranPlayer) {
            quranPlayer.updateFloatingButtonState();
        }
    });

    // Update floating button on keydown
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && quranPlayer) {
            // Don't hide the floating button, just update its state
            quranPlayer.updateFloatingButtonState();
        }
    });

    // Update floating button on beforeunload
    window.addEventListener('beforeunload', () => {
        if (quranPlayer) {
            quranPlayer.updateFloatingButtonState();
        }
    });

    // Update floating button on unload
    window.addEventListener('unload', () => {
        if (quranPlayer) {
            quranPlayer.updateFloatingButtonState();
        }
    });

    // Update floating button on pagehide
    window.addEventListener('pagehide', () => {
        if (quranPlayer) {
            quranPlayer.updateFloatingButtonState();
        }
    });

    // Hide floating button on pageshow
    window.addEventListener('pageshow', () => {
        if (quranPlayer) {
            quranPlayer.updateFloatingButtonState();
        }
    });

    // Hide floating button on popstate
    window.addEventListener('popstate', () => {
        if (quranPlayer) {
            quranPlayer.updateFloatingButtonState();
        }
    });

    // Hide floating button on hashchange
    window.addEventListener('hashchange', () => {
        if (quranPlayer) {
            quranPlayer.updateFloatingButtonState();
        }
    });

    // Hide floating button on storage
    window.addEventListener('storage', () => {
        if (quranPlayer) {
            quranPlayer.updateFloatingButtonState();
        }
    });

    // Hide floating button on message
    window.addEventListener('message', () => {
        if (quranPlayer) {
            quranPlayer.updateFloatingButtonState();
        }
    });

    // Update floating button on error
    window.addEventListener('error', () => {
        if (quranPlayer) {
            quranPlayer.updateFloatingButtonState();
        }
    });

    // Update floating button on offline
    window.addEventListener('offline', () => {
        if (quranPlayer) {
            quranPlayer.updateFloatingButtonState();
        }
    });

    // Hide floating button on online
    window.addEventListener('online', () => {
        if (quranPlayer) {
            quranPlayer.updateFloatingButtonState();
        }
    });

    // Hide floating button on load
    window.addEventListener('load', () => {
        if (quranPlayer) {
            quranPlayer.updateFloatingButtonState();
        }
    });

    // Hide floating button on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        if (quranPlayer) {
            quranPlayer.updateFloatingButtonState();
        }
    });
});

// Global functions for external access
function playSurah(surahIndex) {
    if (quranPlayer) {
        quranPlayer.playSurah(surahIndex);
    } else {
        // Hide floating button if player is not initialized
        const floatingBtn = document.getElementById('floatingPlayerBtn');
        if (floatingBtn) {
            floatingBtn.classList.remove('show', 'playing');
        }
    }
}

function showPlayer() {
    if (quranPlayer) {
        // Show the player container first
        const container = document.getElementById('quranPlayerContainer');
        if (container) {
            container.style.display = 'block';
            container.classList.remove('hide');
            container.classList.add('show');

            // Add body padding on mobile when player is shown
            if (window.innerWidth <= 768) {
                document.body.classList.add('player-active');
            }
        }
        // Then expand it
        quranPlayer.toggleExpanded();
    } else {
        // If player is not initialized, wait for it
        setTimeout(() => {
            if (quranPlayer) {
                const container = document.getElementById('quranPlayerContainer');
                if (container) {
                    container.style.display = 'block';
                    container.classList.remove('hide');
                    container.classList.add('show');
                }
                quranPlayer.toggleExpanded();
            } else {
                // If still not initialized, try again
                setTimeout(() => {
                    if (quranPlayer) {
                        const container = document.getElementById('quranPlayerContainer');
                        if (container) {
                            container.style.display = 'block';
                            container.classList.remove('hide');
                            container.classList.add('show');
                        }
                        quranPlayer.toggleExpanded();
                    }
                }, 500);
            }
        }, 100);
    }
}
