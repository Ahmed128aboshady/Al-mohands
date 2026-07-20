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
    // 4. حاسبة الأسعار التفاعلية (EGP Pricing Calculator)
    // ==========================================
    const calcProduct = document.getElementById('calc-product');
    const calcWidth = document.getElementById('calc-width');
    const calcHeight = document.getElementById('calc-height');
    const calcCount = document.getElementById('calc-count');
    const windowOptions = document.getElementById('window-options');
    const calcGlass = document.getElementById('calc-glass');
    const calcFlyscreen = document.getElementById('calc-flyscreen');
    const calcBtn = document.getElementById('calculate-btn');
    const priceVal = document.getElementById('price-val');
    const priceDetails = document.getElementById('price-details');
    const calcWhatsappBtn = document.getElementById('calc-whatsapp-btn');

    if (calcProduct) {
        calcProduct.addEventListener('change', () => {
            const prod = calcProduct.value;
            if (prod === 'kitchen') {
                windowOptions.style.display = 'none';
                document.getElementById('calc-width-label').innerHTML = '<i class="fa-solid fa-ruler-horizontal form-icon"></i> الطول الإجمالي للمطبخ (متر طولي):';
                document.getElementById('calc-height-group').style.display = 'none'; 
            } else if (prod === 'window') {
                windowOptions.style.display = 'block';
                document.getElementById('calc-width-label').innerHTML = '<i class="fa-solid fa-ruler-horizontal form-icon"></i> عرض الشباك (متر):';
                document.getElementById('calc-height-group').style.display = 'block';
            } else if (prod === 'door') {
                windowOptions.style.display = 'none';
                document.getElementById('calc-width-label').innerHTML = '<i class="fa-solid fa-ruler-horizontal form-icon"></i> عرض الباب (متر):';
                document.getElementById('calc-height-group').style.display = 'block';
            }
        });
    }

    if (calcBtn) {
        calcBtn.addEventListener('click', () => {
            const prod = calcProduct.value;
            const w = parseFloat(calcWidth.value) || 0;
            const h = parseFloat(calcHeight.value) || 0;
            const count = parseInt(calcCount.value) || 1;

            if (w <= 0 || (prod !== 'kitchen' && h <= 0)) {
                alert('الرجاء إدخال قياسات صحيحة أكبر من الصفر!');
                return;
            }

            let total = 0;
            let details = '';

            if (prod === 'kitchen') {
                // سعر المتر الطولي للمطبخ بي إس 5500 ج.م
                const meterPrice = 5500;
                const baseCost = w * meterPrice * count;
                total = baseCost;
                details = `<li>مطبخ ألوميتال قطاع (بي إس) بطول ${w} متر × ${count} وحدات: <strong>${baseCost.toLocaleString()} ج.م</strong></li>`;
            } 
            else if (prod === 'window') {
                // شباك منزلق بي إس 4200 ج.م للمتر المربع
                const area = w * h * count;
                const sqMeterPrice = 4200;
                let baseCost = area * sqMeterPrice;
                
                let glassCost = 0;
                if (calcGlass.value === 'double') {
                    glassCost = area * 800; // إضافي زجاج دبل عاكس
                }
                
                let screenCost = 0;
                if (calcFlyscreen.checked) {
                    screenCost = count * 600; // سلك بليسيه منزلق
                }

                total = baseCost + glassCost + screenCost;
                details = `
                    <li>شباك ألوميتال منزلق (بي إس) بمساحة إجمالية ${area.toFixed(2)} م²: <strong>${baseCost.toLocaleString()} ج.م</strong></li>
                    ${glassCost > 0 ? `<li>إضافي زجاج دبل عاكس عازل للصوت والحرارة: <strong>${glassCost.toLocaleString()} ج.م</strong></li>` : ''}
                    ${screenCost > 0 ? `<li>إضافي سلك بليسيه مانع للأتربة والحشرات: <strong>${screenCost.toLocaleString()} ج.م</strong></li>` : ''}
                `;
            } 
            else if (prod === 'door') {
                // باب حمام أو مطبخ بي إس بسعر ثابت 4800 ج.م للباب
                const unitPrice = 4800;
                const baseCost = count * unitPrice;
                total = baseCost;
                details = `<li>باب ألوميتال قطاع (بي إس) حمام/مطبخ عدد ${count}: <strong>${baseCost.toLocaleString()} ج.م</strong></li>`;
            }

            priceVal.textContent = Math.round(total).toLocaleString();
            priceDetails.innerHTML = details;

            // تحديث رابط الواتساب بالتفاصيل المحسوبة
            let prodName = 'مطبخ';
            if (prod === 'window') prodName = 'شباك شقة';
            if (prod === 'door') prodName = 'باب ألوميتال';

            let msg = `مرحباً ورشة المهندس، قمت بحساب تكلفة تقديرية لـ ${prodName} عبر حاسبة الأسعار:\n`;
            msg += `- الأبعاد: عرض ${w} م ${prod !== 'kitchen' ? `× ارتفاع ${h} م` : ''}\n`;
            msg += `- العدد المطلوبة: ${count}\n`;
            if (prod === 'window') {
                const glassText = calcGlass.options[calcGlass.selectedIndex].text;
                msg += `- نوع الزجاج: ${glassText}\n`;
                msg += `- سلك حشرات: ${calcFlyscreen.checked ? 'نعم' : 'لا'}\n`;
            }
            msg += `- التكلفة الإجمالية التقديرية: ${Math.round(total).toLocaleString()} ج.م\n`;
            msg += `أود تأكيد موعد للمعاينة الفنية ورفع المقاسات الفعلية.`;

            calcWhatsappBtn.href = `https://wa.me/201234567890?text=${encodeURIComponent(msg)}`;
        });
    }
});



