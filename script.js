/* ==========================================================================
   المهندس للألوميتال والزجاج - برمجة الصفحة الرئيسية (script.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. إدارة الوضع الداكن والمضيء (Dark/Light Mode)
    // ==========================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = themeToggleBtn.querySelector('i');
    
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.className = 'fa-solid fa-sun';
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        themeIcon.className = 'fa-solid fa-moon';
    }
    
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            themeIcon.className = 'fa-solid fa-moon';
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeIcon.className = 'fa-solid fa-sun';
            localStorage.setItem('theme', 'dark');
        }
    });

    // ==========================================
    // 2. شريط التنقل المتجاوب والقائمة الجانبية للموبايل
    // ==========================================
    const menuToggle = document.getElementById('menu-toggle');
    const navbar = document.getElementById('navbar');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    const navLinks = document.querySelectorAll('.nav-link');
    
    function toggleMobileMenu() {
        navbar.classList.toggle('open');
        mobileMenuOverlay.classList.toggle('open');
        const isOpen = navbar.classList.contains('open');
        menuToggle.querySelector('i').className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
    }
    
    menuToggle.addEventListener('click', toggleMobileMenu);
    mobileMenuOverlay.addEventListener('click', toggleMobileMenu);
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navbar.classList.contains('open')) {
                toggleMobileMenu();
            }
        });
    });

    // ==========================================
    // 3. تصفية معرض الأعمال (Portfolio Filter)
    // ==========================================
    const filterButtons = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filterValue = button.getAttribute('data-filter');

            portfolioItems.forEach(item => {
                if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // ==========================================
    // 3.5. نافذة تكبير صور المعرض (Portfolio Lightbox Modal)
    // ==========================================
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.getElementById('lightbox-close');

    if (lightboxModal) {
        document.querySelectorAll('.portfolio-item').forEach(item => {
            const btn = item.querySelector('.view-project-btn');
            const img = item.querySelector('img');
            const title = item.querySelector('h4');

            const openLightbox = (e) => {
                e.stopPropagation();
                if (img) {
                    lightboxImg.src = img.src;
                    lightboxCaption.textContent = title ? title.textContent : img.alt;
                    lightboxModal.style.display = 'flex';
                }
            };

            if (btn) btn.addEventListener('click', openLightbox);
            const imageBox = item.querySelector('.portfolio-image-box');
            if (imageBox) imageBox.addEventListener('click', openLightbox);
        });

        const closeLightbox = () => {
            lightboxModal.style.display = 'none';
        };

        if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);

        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) {
                closeLightbox();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightboxModal.style.display === 'flex') {
                closeLightbox();
            }
        });
    }

    // ==========================================
    // 4. حاسبة الأسعار التفاعلية (EGP Pricing Calculator)
    // ==========================================
    const calcType = document.getElementById('calc-type');
    const calcWidth = document.getElementById('calc-width');
    const calcHeight = document.getElementById('calc-height');
    const calcProfile = document.getElementById('calc-profile');
    const calcGlass = document.getElementById('calc-glass');
    const glassGroup = document.getElementById('glass-group');
    const addHydraulic = document.getElementById('add-hydraulic');
    const addMatte = document.getElementById('add-matte');
    const addLed = document.getElementById('add-led');
    const addLedContainer = document.getElementById('add-led-container');
    const priceVal = document.getElementById('price-val');
    const priceDetails = document.getElementById('price-details');
    const calcWhatsappBtn = document.getElementById('calc-whatsapp-btn');

    const profileOptions = {
        'kitchen': [
            { value: 'clad-ferrari', label: 'كلادينج فيراري دبل شيت (أعلى جودة)', price: 5800 },
            { value: 'khachmonium', label: 'خشمونيوم قطاع ثقيل مقاوم للمياه', price: 6200 },
            { value: 'fiberglass', label: 'ألوميتال فيبر جلاس اقتصادي متين', price: 4800 }
        ],
        'door': [
            { value: 'ps-large', label: 'قطاع بي إس كبير (PS Large 9600)', price: 5200 },
            { value: 'ps-small', label: 'قطاع بي إس صغير (PS Small 6600)', price: 4500 },
            { value: 'tango', label: 'قطاع تانجو / جامبو ثقيل', price: 5800 }
        ],
        'window': [
            { value: 'ps-small', label: 'قطاع بي إس صغير عازل (PS 6600)', price: 4200 },
            { value: 'ps-large', label: 'قطاع بي إس كبير (PS 9600)', price: 4800 },
            { value: 'jumbo', label: 'قطاع جامبو 100 عازل للصوت والأتربة', price: 5500 }
        ],
        'pvc-door': [
            { value: 'upvc-turkish', label: 'قطاع UPVC تركي مسلح بالحديد المجلفن', price: 6500 },
            { value: 'pvc-kompen', label: 'قطاع PVC كومبن / وين تك عازل 100%', price: 7200 }
        ],
        'pvc-window': [
            { value: 'upvc-sliding', label: 'قطاع UPVC جرار دبل عازل للصوت والحرارة', price: 4900 },
            { value: 'upvc-tilt', label: 'قطاع UPVC مفصلي قلاب (Tilt & Turn)', price: 5400 }
        ],
        'armored-door': [
            { value: 'armored-turkish', label: 'باب مصفح تركي أصلي (تصفيح كامل + 2 كالون)', price: 14500 },
            { value: 'armored-italian', label: 'باب مصفح إيطالي سوبر لوكس (عزل صوت وحريق)', price: 18500 }
        ]
    };

    function updateProfileOptions() {
        if (!calcType || !calcProfile) return;
        const type = calcType.value;
        const options = profileOptions[type] || profileOptions['kitchen'];
        calcProfile.innerHTML = options.map(opt => `<option value="${opt.value}" data-price="${opt.price}">${opt.label}</option>`).join('');

        if (glassGroup) {
            glassGroup.style.display = (type === 'kitchen' || type === 'armored-door') ? 'none' : 'block';
        }
        if (addLedContainer) {
            addLedContainer.style.display = (type === 'kitchen') ? 'flex' : 'none';
        }
        calculateTotal();
    }

    function calculateTotal() {
        if (!calcType || !priceVal) return;
        const type = calcType.value;
        const w = parseFloat(calcWidth?.value) || 1;
        const h = parseFloat(calcHeight?.value) || 1;
        const selectedOpt = calcProfile?.options[calcProfile.selectedIndex];
        const baseRate = selectedOpt ? parseFloat(selectedOpt.getAttribute('data-price')) : 5000;
        const profileName = selectedOpt ? selectedOpt.textContent : '';

        let total = 0;
        let area = w * h;
        let detailsHtml = '';

        if (type === 'door' || type === 'pvc-door' || type === 'armored-door') {
            total = baseRate;
            detailsHtml += `<div>• السعر الأساسي (${profileName}): <strong>${baseRate.toLocaleString()} ج.م</strong></div>`;
        } else {
            const baseCost = area * baseRate;
            total = baseCost;
            detailsHtml += `<div>• المساحة (${area.toFixed(2)} م²) × ${baseRate.toLocaleString()} ج.م: <strong>${Math.round(baseCost).toLocaleString()} ج.م</strong></div>`;
        }

        if (type !== 'kitchen' && type !== 'armored-door' && calcGlass) {
            const gVal = calcGlass.value;
            let gExtra = 0;
            if (gVal === 'double-plain') gExtra = area * 500;
            if (gVal === 'double-reflective') gExtra = area * 750;
            if (gExtra > 0) {
                total += gExtra;
                detailsHtml += `<div>• إضافي الزجاج الدبل العازل: <strong>${Math.round(gExtra).toLocaleString()} ج.م</strong></div>`;
            }
        }

        if (addHydraulic && addHydraulic.checked) {
            const hydExtra = 850;
            total += hydExtra;
            detailsHtml += `<div>• إكسسوارات ومفصلات هيدروليك (Soft Close): <strong>${hydExtra} ج.م</strong></div>`;
        }
        if (type === 'kitchen' && addLed && addLed.checked) {
            const ledExtra = 650;
            total += ledExtra;
            detailsHtml += `<div>• نظام إضاءة LED مدمجة: <strong>${ledExtra} ج.م</strong></div>`;
        }

        priceVal.textContent = Math.round(total).toLocaleString();
        if (priceDetails) priceDetails.innerHTML = detailsHtml;

        if (calcWhatsappBtn) {
            const typeText = calcType.options[calcType.selectedIndex].textContent;
            const msg = `مرحباً المهندس للألوميتال، قمت بحساب تكلفة مبدئية على الموقع:\n- النوع: ${typeText}\n- القطاع: ${profileName}\n- المقاس: ${w}م × ${h}م\n- التكلفة التقديرية: ${Math.round(total).toLocaleString()} ج.م\nأود الاستفسار وحجز معاينة.`;
            calcWhatsappBtn.href = `https://wa.me/201234567890?text=${encodeURIComponent(msg)}`;
        }
    }

    if (calcType) {
        calcType.addEventListener('change', updateProfileOptions);
        [calcWidth, calcHeight, calcProfile, calcGlass, addHydraulic, addMatte, addLed].forEach(el => {
            if (el) el.addEventListener('input', calculateTotal);
            if (el) el.addEventListener('change', calculateTotal);
        });
        updateProfileOptions();
    }
});



