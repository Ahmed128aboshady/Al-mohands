/* ==========================================================================
   المهندس للألوميتال والزجاج - مخطط المطابخ ثلاثي الأبعاد تفصيلي (planner.js)
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
    // 3. إدارة موارد ثلاثي الأبعاد لمنع التهنيج وتسريب الذاكرة (Three.js Optimization)
    // ==========================================
    let activeGeometries = [];
    let activeMaterials = [];

    function trackGeo(g) {
        if (g) activeGeometries.push(g);
        return g;
    }

    function trackMat(m) {
        if (m) activeMaterials.push(m);
        return m;
    }

    function cleanup3DResources() {
        if (typeof kitchenGroup === 'undefined' || !kitchenGroup) return;
        
        // إزالة كافة الأجسام من المجموعة
        while(kitchenGroup.children.length > 0) {
            const child = kitchenGroup.children[0];
            while(child.children && child.children.length > 0) {
                const grandChild = child.children[0];
                child.remove(grandChild);
            }
            kitchenGroup.remove(child);
        }

        // تحرير ذاكرة المجسمات
        activeGeometries.forEach(g => {
            if (g && typeof g.dispose === 'function') g.dispose();
        });
        activeGeometries = [];

        // تحرير ذاكرة المواد
        activeMaterials.forEach(m => {
            if (m && typeof m.dispose === 'function') m.dispose();
        });
        activeMaterials = [];
    }

    // ==========================================
    // 4. إعدادات الشبكة التفاعلية 2D (Sketchpad Board)
    // ==========================================
    const planShape = document.getElementById('plan-shape');
    const planStyle = document.getElementById('plan-style');
    const customColorGroup = document.getElementById('custom-color-group');
    const planColorPicker = document.getElementById('plan-color-picker');
    const customColorHex = document.getElementById('custom-color-hex');
    const planWall1 = document.getElementById('plan-wall1');
    const planWall2 = document.getElementById('plan-wall2');
    const wall2Group = document.getElementById('wall2-group');
    const planHandles = document.getElementById('plan-handles');
    const planCountertop = document.getElementById('plan-countertop');
    const generateBtn = document.getElementById('generate-design-btn');
    
    const plannerEmptyState = document.getElementById('planner-empty-state');
    const plannerResultsContent = document.getElementById('planner-results-content');
    
    const triangleAdvice = document.getElementById('triangle-advice');
    const colorAdvice = document.getElementById('color-advice');
    const selectedAccList = document.getElementById('selected-acc-list');
    const planEstimatedPrice = document.getElementById('plan-estimated-price');
    const sendSpecsWhatsappBtn = document.getElementById('send-specs-whatsapp-btn');

    const uploadDropzone = document.getElementById('upload-dropzone');
    const sketchUpload = document.getElementById('sketch-upload');
    const uploadPreviewWrapper = document.getElementById('upload-preview-wrapper');
    const uploadedSketchImg = document.getElementById('uploaded-sketch-img');
    const removeUpload = document.getElementById('remove-upload');
    const visualizerLoader = document.getElementById('visualizer-loader');

    const gridBoard = document.getElementById('grid-board');
    const clearGridBtn = document.getElementById('clear-grid-btn');
    const paletteBtns = document.querySelectorAll('.palette-btn');
    
    let gridData = Array(36).fill('empty');
    let currentBrush = 'cabinet';
    let isUsingCustomGrid = false;

    let scene, camera, renderer, controls, kitchenGroup, dirLight;
    let is3DInitialized = false;
    const isMobileDevice = typeof window !== 'undefined' && (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768) || ('ontouchstart' in window));
    let isFastPerfMode = isMobileDevice;

    function createGridBoard() {
        gridBoard.innerHTML = '';
        for (let i = 0; i < 36; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            if (gridData[i] !== 'empty') {
                cell.className = `grid-cell ${gridData[i]}`;
            }
            cell.setAttribute('data-idx', i);
            
            const handleCellToggle = (e) => {
                if (e && e.cancelable) e.preventDefault();
                isUsingCustomGrid = true;
                
                if (gridData[i] === currentBrush) {
                    gridData[i] = 'empty';
                    cell.className = 'grid-cell';
                } else {
                    gridData[i] = currentBrush;
                    cell.className = `grid-cell ${currentBrush}`;
                }
                
                update3DFromSketchpad();
            };

            cell.addEventListener('pointerdown', handleCellToggle);
            
            gridBoard.appendChild(cell);
        }
    }

    paletteBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            paletteBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentBrush = btn.getAttribute('data-brush');
        });
    });

    clearGridBtn.addEventListener('click', () => {
        gridData = Array(36).fill('empty');
        isUsingCustomGrid = false;
        createGridBoard();
        
        const shape = planShape.value;
        const style = planStyle.value;
        const countertop = planCountertop.value;
        const hasLed = document.querySelector('.plan-acc[value="led-under"]').checked;
        
        if (is3DInitialized) {
            update3DKitchen(shape, style, countertop, hasLed);
        }
        
        plannerEmptyState.style.display = 'flex';
        plannerResultsContent.style.display = 'none';
    });

    createGridBoard();

    uploadDropzone.addEventListener('click', (e) => {
        if (e.target !== removeUpload && !removeUpload.contains(e.target)) {
            sketchUpload.click();
        }
    });

    uploadDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadDropzone.classList.add('dragover');
    });

    uploadDropzone.addEventListener('dragleave', () => {
        uploadDropzone.classList.remove('dragover');
    });

    uploadDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadDropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleSketchFile(e.dataTransfer.files[0]);
        }
    });

    sketchUpload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleSketchFile(e.target.files[0]);
        }
    });

    function handleSketchFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('الرجاء رفع ملف صورة صالح (PNG أو JPG)');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedSketchImg.src = e.target.result;
            uploadPreviewWrapper.style.display = 'block';
            
            uploadDropzone.querySelector('.upload-icon').style.display = 'none';
            uploadDropzone.querySelector('.upload-text').style.display = 'none';
            uploadDropzone.querySelector('.upload-hint').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }

    removeUpload.addEventListener('click', (e) => {
        e.stopPropagation();
        sketchUpload.value = '';
        uploadedSketchImg.src = '';
        uploadPreviewWrapper.style.display = 'none';
        
        uploadDropzone.querySelector('.upload-icon').style.display = 'inline-block';
        uploadDropzone.querySelector('.upload-text').style.display = 'block';
        uploadDropzone.querySelector('.upload-hint').style.display = 'block';
    });

    planShape.addEventListener('change', () => {
        const shape = planShape.value;
        if (shape === 'straight' || shape === 'island') {
            wall2Group.style.display = 'none';
        } else {
            wall2Group.style.display = 'block';
            if (shape === 'u-shape') {
                document.getElementById('plan-wall2-label').innerHTML = '<i class="fa-solid fa-ruler-horizontal form-icon"></i> طول الجدران الجانبية (متر):';
            } else {
                document.getElementById('plan-wall2-label').innerHTML = '<i class="fa-solid fa-ruler-horizontal form-icon"></i> طول الجدار الجانبي (متر):';
            }
        }

        // تعبئة الشبكة تلقائياً بالتوزيع المناسب بناءً على الشكل المختار
        gridData = Array(36).fill('empty');
        isUsingCustomGrid = true;
        
        if (shape === 'straight') {
            gridData[1] = 'cabinet';
            gridData[2] = 'sink';
            gridData[3] = 'cooker';
            gridData[4] = 'cabinet';
        } else if (shape === 'l-shape') {
            gridData[0] = 'cabinet'; // وحدة الركنة المشتركة
            gridData[1] = 'cabinet';
            gridData[2] = 'sink';
            gridData[3] = 'cabinet';
            gridData[4] = 'cabinet';
            gridData[6] = 'cooker';
            gridData[12] = 'cabinet';
            gridData[18] = 'fridge';
        } else if (shape === 'u-shape') {
            gridData[0] = 'cabinet'; // وحدة الركنة اليسرى المشتركة
            gridData[1] = 'sink';
            gridData[2] = 'cabinet';
            gridData[3] = 'cabinet';
            gridData[4] = 'cabinet';
            gridData[5] = 'cabinet'; // وحدة الركنة اليمنى المشتركة
            gridData[6] = 'cooker';
            gridData[12] = 'cabinet';
            gridData[18] = 'fridge';
            gridData[11] = 'cabinet';
            gridData[17] = 'cabinet';
            gridData[23] = 'cabinet';
        } else if (shape === 'island') {
            gridData[1] = 'cabinet';
            gridData[2] = 'sink';
            gridData[3] = 'cooker';
            gridData[4] = 'cabinet';
            gridData[26] = 'cabinet';
            gridData[27] = 'cabinet';
        }
        
        createGridBoard();
        update3DFromSketchpad();
        
        plannerEmptyState.style.display = 'none';
        plannerResultsContent.style.display = 'block';
    });

    planStyle.addEventListener('change', () => {
        if (planStyle.value === 'custom') {
            customColorGroup.style.display = 'block';
        } else {
            customColorGroup.style.display = 'none';
        }
        
        // تحديث الرندرة فورياً لتطبيق تغيير الألوان
        if (isUsingCustomGrid) {
            update3DFromSketchpad();
        } else {
            const shape = planShape.value;
            const style = planStyle.value;
            const countertop = planCountertop.value;
            const hasLed = document.querySelector('.plan-acc[value="led-under"]').checked;
            update3DKitchen(shape, style, countertop, hasLed);
        }
    });

    planColorPicker.addEventListener('input', () => {
        customColorHex.textContent = planColorPicker.value.toUpperCase();
        // تحديث الرندرة فورياً مع حركة الفأرة
        if (isUsingCustomGrid) {
            update3DFromSketchpad();
        } else {
            const shape = planShape.value;
            const style = planStyle.value;
            const countertop = planCountertop.value;
            const hasLed = document.querySelector('.plan-acc[value="led-under"]').checked;
            update3DKitchen(shape, style, countertop, hasLed);
        }
    });

    // ==========================================
    // 5. تهيئة بيئة الرندرة ثلاثية الأبعاد (Three.js Visualizer)
    // ==========================================
    function init3DVisualizer() {
        const container = document.getElementById('canvas-3d-container');
        if (!container) return;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0b0f19); 

        const width = container.clientWidth;
        const height = container.clientHeight;
        camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
        camera.position.set(4.5, 4.5, 6.5);

        renderer = new THREE.WebGLRenderer({ antialias: !isFastPerfMode, powerPreference: isFastPerfMode ? 'default' : 'high-performance' });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isFastPerfMode ? (isMobileDevice ? 0.85 : 1.0) : 1.5));
        renderer.shadowMap.enabled = !isFastPerfMode;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        renderer.outputEncoding = THREE.sRGBEncoding; 
        container.appendChild(renderer.domElement);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = isMobileDevice ? 0.1 : 0.05;
        controls.rotateSpeed = isMobileDevice ? 0.7 : 1.0;
        controls.maxPolarAngle = Math.PI / 2 - 0.02; 
        controls.minDistance = 2.5;
        controls.maxDistance = 12;

        const ambientLight = new THREE.AmbientLight(0xffffff, isFastPerfMode ? 0.75 : 0.45);
        scene.add(ambientLight);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
        scene.add(hemiLight);

        dirLight = new THREE.DirectionalLight(0xffffff, 0.95);
        dirLight.position.set(5, 8, 4);
        dirLight.castShadow = !isFastPerfMode;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 18;
        dirLight.shadow.camera.left = -6;
        dirLight.shadow.camera.right = 6;
        dirLight.shadow.camera.top = 6;
        dirLight.shadow.camera.bottom = -6;
        dirLight.shadow.bias = -0.0003;
        dirLight.shadow.radius = 2;
        scene.add(dirLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.35, 10);
        pointLight.position.set(0, 3, 3);
        scene.add(pointLight);

        const floorGeo = new THREE.PlaneGeometry(16, 16);
        const floorMat = new THREE.MeshStandardMaterial({ 
            color: 0x090d16, 
            roughness: 0.2,
            metalness: 0.5
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.5;
        floor.receiveShadow = !isFastPerfMode; 
        scene.add(floor);

        const gridHelper = new THREE.GridHelper(16, 16, 0x4b5563, 0x111827);
        gridHelper.position.y = -0.49;
        scene.add(gridHelper);

        kitchenGroup = new THREE.Group();
        scene.add(kitchenGroup);

        let renderRequested = false;
        function renderScene() {
            renderRequested = false;
            controls.update();
            renderer.render(scene, camera);
        }
        function requestRender() {
            if (!renderRequested) {
                renderRequested = true;
                requestAnimationFrame(renderScene);
            }
        }

        controls.addEventListener('change', requestRender);
        window.requestSceneRender = requestRender;

        // تشغيل الرندرة الأولية
        requestRender();

        // زر التبديل بين وضع الأداء الفائق ووضع الدقة
        const perfToggleBtn = document.getElementById('perf-toggle-btn');
        const perfToggleText = document.getElementById('perf-toggle-text');

        function updatePerfUI() {
            if (!perfToggleBtn || !perfToggleText) return;
            if (isFastPerfMode) {
                perfToggleText.textContent = "وضع الأداء الفائق ⚡";
                perfToggleBtn.style.borderColor = "var(--color-primary)";
                perfToggleBtn.style.color = "var(--color-primary)";
            } else {
                perfToggleText.textContent = "وضع الدقة والظلال 🎨";
                perfToggleBtn.style.borderColor = "var(--border-color)";
                perfToggleBtn.style.color = "var(--text-secondary)";
            }
        }
        updatePerfUI();

        if (perfToggleBtn) {
            perfToggleBtn.addEventListener('click', () => {
                isFastPerfMode = !isFastPerfMode;
                updatePerfUI();
                renderer.shadowMap.enabled = !isFastPerfMode;
                dirLight.castShadow = !isFastPerfMode;
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, isFastPerfMode ? (isMobileDevice ? 0.85 : 1.0) : 1.5));
                
                if (isUsingCustomGrid) {
                    update3DFromSketchpad();
                } else {
                    const shape = planShape.value;
                    const style = planStyle.value;
                    const countertop = planCountertop.value;
                    const hasLed = document.querySelector('.plan-acc[value="led-under"]').checked;
                    update3DKitchen(shape, style, countertop, hasLed);
                }
                requestRender();
            });
        }

        window.addEventListener('resize', () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileDevice ? 1.0 : 1.5));
        });

        is3DInitialized = true;
    }

    // دالة مساعدة لرسم خزانة علوية على شكل حرف L (متلاحمة بالكامل بالركنة بدون فواصل)
    function createLCornerUpperCabinet(parentGroup, type, cabMaterial, doorMaterial, doorLineMat, handleMaterial, handleGeo) {
        // Box 1 (الجزء الخلفي المحاذي للجدار الرئيسي - محاذي تماماً لعمق الخزائن الرئيسية z = -0.12)
        const box1Geo = trackGeo(new THREE.BoxGeometry(0.6, 0.7, 0.32));
        const box1 = new THREE.Mesh(box1Geo, cabMaterial);
        box1.position.set(0, 1.25, -0.12);
        box1.castShadow = true;
        box1.receiveShadow = true;
        
        // Box 2 (الجزء الجانبي الممتد للمطبخ بطول 0.44 ليتحاذى 100% مع الخزائن الجانبية)
        const box2Geo = trackGeo(new THREE.BoxGeometry(0.32, 0.7, 0.44));
        const box2 = new THREE.Mesh(box2Geo, cabMaterial);
        box2.castShadow = true;
        box2.receiveShadow = true;
        
        // Door 1 (الباب المواجه للجدار الرئيسي داخل المطبخ - محاذي لخط الأبواب z = 0.05)
        const door1Geo = trackGeo(new THREE.BoxGeometry(0.278, 0.68, 0.02));
        const door1 = new THREE.Mesh(door1Geo, doorMaterial);
        door1.castShadow = true;
        door1.add(new THREE.LineSegments(trackGeo(new THREE.EdgesGeometry(door1Geo)), doorLineMat));
        
        // Door 2 (الباب الجانبي المواجه لداخل المطبخ - محاذي لخط الأبواب الجانبية)
        const door2Geo = trackGeo(new THREE.BoxGeometry(0.02, 0.68, 0.418));
        const door2 = new THREE.Mesh(door2Geo, doorMaterial);
        door2.castShadow = true;
        door2.add(new THREE.LineSegments(trackGeo(new THREE.EdgesGeometry(door2Geo)), doorLineMat));
        
        if (type === 'left-top') {
            box2.position.set(-0.12, 1.25, 0.18); // محاذاة 100% مع الخزائن الجانبية اليسرى
            
            door1.position.set(0.15, 1.25, 0.05);
            door2.position.set(0.05, 1.25, 0.18); // محاذاة تامة لخط الأبواب اليسرى
            
            parentGroup.add(box1);
            parentGroup.add(box2);
            parentGroup.add(door1);
            parentGroup.add(door2);
            
            if (planHandles.value !== 'gola') {
                const h1 = new THREE.Mesh(handleGeo, handleMaterial);
                h1.position.set(0.03, 1.05, 0.07);
                h1.castShadow = true;
                parentGroup.add(h1);
                
                const h2 = new THREE.Mesh(handleGeo, handleMaterial);
                h2.position.set(0.07, 1.05, 0.35);
                h2.castShadow = true;
                parentGroup.add(h2);
            }
        } else if (type === 'right-top') {
            box2.position.set(0.12, 1.25, 0.18); // محاذاة 100% مع الخزائن الجانبية اليمنى
            
            door1.position.set(-0.15, 1.25, 0.05);
            door2.position.set(-0.05, 1.25, 0.18); // محاذاة تامة لخط الأبواب اليمنى
            
            parentGroup.add(box1);
            parentGroup.add(box2);
            parentGroup.add(door1);
            parentGroup.add(door2);
            
            if (planHandles.value !== 'gola') {
                const h1 = new THREE.Mesh(handleGeo, handleMaterial);
                h1.position.set(-0.03, 1.05, 0.07);
                h1.castShadow = true;
                parentGroup.add(h1);
                
                const h2 = new THREE.Mesh(handleGeo, handleMaterial);
                h2.position.set(-0.07, 1.05, 0.35);
                h2.castShadow = true;
                parentGroup.add(h2);
            }
        }
    }

    // دالة مساعدة لتوليد رخام كلكتا ذهبي أو كوارتز أبيض أو أسود جلاكسي واقعي برمجياً
    function getCountertopMaterial(countertop) {
        if (countertop === 'none') {
            return new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        if (countertop === 'galaxy-black') {
            ctx.fillStyle = '#0f1115';
            ctx.fillRect(0, 0, 512, 512);
            
            // غيوم داكنة خفيفة
            for (let i = 0; i < 4; i++) {
                ctx.strokeStyle = 'rgba(31, 41, 55, 0.15)';
                ctx.lineWidth = 60 + Math.random() * 40;
                ctx.beginPath();
                ctx.moveTo(Math.random() * 512, 0);
                ctx.bezierCurveTo(Math.random() * 512, 128, Math.random() * 512, 384, Math.random() * 512, 512);
                ctx.stroke();
            }
            
            // لمعة الفصوص الذهبية والفضية الفاخرة للجرانيت الأسود
            for (let i = 0; i < 180; i++) {
                const r = Math.random();
                ctx.fillStyle = r < 0.45 ? 'rgba(212, 175, 55, 0.7)' : r < 0.8 ? 'rgba(255, 255, 255, 0.6)' : 'rgba(120, 120, 120, 0.5)';
                const size = 1.0 + Math.random() * 2.0;
                ctx.fillRect(Math.random() * 512, Math.random() * 512, size, size);
            }
        } else if (countertop === 'carrara-gray') {
            ctx.fillStyle = '#f3f4f6';
            ctx.fillRect(0, 0, 512, 512);
            
            // تموجات رمادية خفيفة
            for (let i = 0; i < 6; i++) {
                ctx.strokeStyle = 'rgba(209, 213, 219, 0.35)';
                ctx.lineWidth = 40 + Math.random() * 40;
                ctx.beginPath();
                ctx.moveTo(Math.random() * 512, 0);
                ctx.bezierCurveTo(Math.random() * 512, 128, Math.random() * 512, 384, Math.random() * 512, 512);
                ctx.stroke();
            }
            
            // عروق رخام كرارة رمادية ناعمة
            ctx.strokeStyle = 'rgba(107, 114, 128, 0.35)';
            for (let i = 0; i < 6; i++) {
                ctx.lineWidth = 0.5 + Math.random() * 1.5;
                ctx.beginPath();
                let x = Math.random() * 512;
                ctx.moveTo(x, 0);
                for (let y = 0; y <= 512; y += 20) {
                    x += (Math.random() - 0.5) * 15;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        } else {
            // رخام كلكتا ذهبي فاخر (Calacatta Gold) ذو عروق ذهبية ورمادية متقاطعة
            ctx.fillStyle = '#fafafa';
            ctx.fillRect(0, 0, 512, 512);
            
            // ظلال كريمية ناعمة جداً بالخلفية
            for (let i = 0; i < 4; i++) {
                ctx.strokeStyle = 'rgba(240, 235, 225, 0.45)';
                ctx.lineWidth = 50 + Math.random() * 50;
                ctx.beginPath();
                ctx.moveTo(Math.random() * 512, 0);
                ctx.bezierCurveTo(Math.random() * 512, 128, Math.random() * 512, 384, Math.random() * 512, 512);
                ctx.stroke();
            }
            
            // عروق ذهبية دافئة
            ctx.strokeStyle = 'rgba(197, 160, 89, 0.45)';
            for (let i = 0; i < 3; i++) {
                ctx.lineWidth = 1.0 + Math.random() * 1.5;
                ctx.beginPath();
                let x = Math.random() * 512;
                ctx.moveTo(x, 0);
                for (let y = 0; y <= 512; y += 15) {
                    x += (Math.random() - 0.5) * 20;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            
            // عروق رمادية متداخلة
            ctx.strokeStyle = 'rgba(120, 120, 120, 0.25)';
            for (let i = 0; i < 4; i++) {
                ctx.lineWidth = 0.5 + Math.random() * 1.0;
                ctx.beginPath();
                let x = Math.random() * 512;
                ctx.moveTo(x, 0);
                for (let y = 0; y <= 512; y += 25) {
                    x += (Math.random() - 0.5) * 15;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1.5, 1.5);
        
        if (isFastPerfMode) {
            return new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.15,
                metalness: 0.05
            });
        }
        
        return new THREE.MeshPhysicalMaterial({
            map: texture,
            roughness: 0.08,
            metalness: 0.05,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05
        });
    }

    // ==========================================
    // 6. منطق رندرة لوحة الرسم 2D -> 3D (تفاعلي ومحسن)
    // ==========================================
    function update3DFromSketchpad() {
        try {
            if (!is3DInitialized) {
                init3DVisualizer();
            }

            // تنظيف الموارد السابقة تماماً
            cleanup3DResources();

            const style = planStyle.value;
            const countertop = planCountertop.value;
            const ledCb = document.querySelector('.plan-acc[value="led-under"]');
            const hasLed = ledCb ? ledCb.checked : false;

        // تهيئة المجسمات الهندسية ومشاركتها لجميع الكائنات لمنع تسريب الذاكرة والبطء (Memory Optimization)
        const lowerGeo = trackGeo(new THREE.BoxGeometry(0.6, 0.75, 0.6));
        const kickGeo = trackGeo(new THREE.BoxGeometry(0.6, 0.1, 0.56));
        const doorGeo = trackGeo(new THREE.BoxGeometry(0.598, 0.74, 0.02));
        const doorEdges = trackGeo(new THREE.EdgesGeometry(doorGeo));
        const topGeo = trackGeo(new THREE.BoxGeometry(0.6, 0.04, 0.6));
        const handleGeo = trackGeo(new THREE.BoxGeometry(0.015, 0.12, 0.015));
        const upperGeo = trackGeo(new THREE.BoxGeometry(0.6, 0.7, 0.32));
        const upperDoorGeo = trackGeo(new THREE.BoxGeometry(0.598, 0.68, 0.02));
        const upperDoorEdges = trackGeo(new THREE.EdgesGeometry(upperDoorGeo));
        const shelfGeo = trackGeo(new THREE.BoxGeometry(0.56, 0.015, 0.28));
        const glassGeo = trackGeo(new THREE.BoxGeometry(0.46, 0.54, 0.01));
        const ledGeo = trackGeo(new THREE.BoxGeometry(0.54, 0.01, 0.04));

        const sinkGeo = trackGeo(new THREE.BoxGeometry(0.44, 0.041, 0.34));
        const faucetPostGeo = trackGeo(new THREE.CylinderGeometry(0.012, 0.012, 0.15));
        const faucetArchGeo = trackGeo(new THREE.BoxGeometry(0.08, 0.02, 0.02));
        const faucetSpoutGeo = trackGeo(new THREE.CylinderGeometry(0.008, 0.008, 0.04));
        const burnerGeo = trackGeo(new THREE.CylinderGeometry(0.06, 0.06, 0.015));
        const hoodGeo = trackGeo(new THREE.BoxGeometry(0.6, 0.35, 0.45));
        const chimneyGeo = trackGeo(new THREE.BoxGeometry(0.2, 0.4, 0.2));
        const fridgeGeo = trackGeo(new THREE.BoxGeometry(0.6, 1.8, 0.6));
        const fDoorGeo = trackGeo(new THREE.BoxGeometry(0.598, 0.58, 0.02));
        const fDoorEdges = trackGeo(new THREE.EdgesGeometry(fDoorGeo));
        const rDoorGeo = trackGeo(new THREE.BoxGeometry(0.598, 1.12, 0.02));
        const rDoorEdges = trackGeo(new THREE.EdgesGeometry(rDoorGeo));
        const lineGeo = trackGeo(new THREE.BoxGeometry(0.6, 0.015, 0.6));
        const fridgeHandleGeo = trackGeo(new THREE.BoxGeometry(0.02, 0.5, 0.02));
        const doorLineMat = trackMat(new THREE.LineBasicMaterial({ color: 0x111111 }));

        let cabMaterial, doorMaterial;
        let handleColor = 0xd4af37;
        
        if (style === 'wood-wood') {
            cabMaterial = isFastPerfMode
                ? trackMat(new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.35, metalness: 0.1 }))
                : trackMat(new THREE.MeshPhysicalMaterial({ color: 0x8b5a2b, roughness: 0.35, metalness: 0.1, clearcoat: 0.5, clearcoatRoughness: 0.15 }));
            doorMaterial = cabMaterial;
            handleColor = 0x111111; 
        } else if (style === 'glossy-white') {
            cabMaterial = isFastPerfMode
                ? trackMat(new THREE.MeshStandardMaterial({ color: 0xfbfbfb, roughness: 0.1, metalness: 0.1 }))
                : trackMat(new THREE.MeshPhysicalMaterial({ color: 0xfbfbfb, roughness: 0.05, metalness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.05 }));
            doorMaterial = cabMaterial;
            handleColor = 0x9ca3af; 
        } else if (style === 'metallic-gray') {
            cabMaterial = trackMat(new THREE.MeshStandardMaterial({ 
                color: 0x3e424b, 
                roughness: 0.35, 
                metalness: 0.8
            }));
            doorMaterial = cabMaterial;
            handleColor = 0x111111;
        } else if (style === 'custom') {
            const customHex = planColorPicker.value;
            const customColorNum = parseInt(customHex.replace('#', '0x'));
            cabMaterial = isFastPerfMode
                ? trackMat(new THREE.MeshStandardMaterial({ color: customColorNum, roughness: 0.25, metalness: 0.4 }))
                : trackMat(new THREE.MeshPhysicalMaterial({ color: customColorNum, roughness: 0.25, metalness: 0.4, clearcoat: 0.85, clearcoatRoughness: 0.05 }));
            doorMaterial = cabMaterial;
            handleColor = 0xd4af37; 
        } else { 
            cabMaterial = isFastPerfMode
                ? trackMat(new THREE.MeshStandardMaterial({ color: 0x18181c, roughness: 0.5, metalness: 0.7 }))
                : trackMat(new THREE.MeshPhysicalMaterial({ color: 0x18181c, roughness: 0.5, metalness: 0.7, clearcoat: 0.15 }));
            doorMaterial = cabMaterial;
            handleColor = 0xd4af37; 
        }

        const topMaterial = trackMat(getCountertopMaterial(countertop));
        
        const handleMaterial = trackMat(new THREE.MeshStandardMaterial({ color: handleColor, roughness: 0.2, metalness: 0.85 }));
        const ledMaterial = trackMat(new THREE.MeshBasicMaterial({ color: 0xfffca1 }));
        const glassMat = trackMat(new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.05, transmission: 0.6, ior: 1.52 })); 
        const steelMaterial = trackMat(new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.8, roughness: 0.2 }));
        const blackGlassMaterial = trackMat(new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.15 }));

        for (let idx = 0; idx < 36; idx++) {
            const type = gridData[idx];
            if (type === 'empty') continue;

            const row = Math.floor(idx / 6);
            const col = idx % 6;

            const x = (col - 2.5) * 0.6;
            const z = (row - 2.5) * 0.6;

            const unitGroup = new THREE.Group();
            unitGroup.position.set(x, -0.05, z);

            // تدوير الخزائن تلقائياً لتواجه المطبخ من الداخل (مع استثناء الأركان لتثبيت هيكل الـ L)
            let rotateY = 0;
            if (idx === 0 || idx === 5) rotateY = 0;
            else if (col === 0) rotateY = Math.PI / 2;
            else if (col === 5) rotateY = -Math.PI / 2;
            else if (row === 0) rotateY = 0;
            else if (row === 5) rotateY = Math.PI;
            else {
                if (row < 3) rotateY = 0;
                else rotateY = Math.PI;
            }
            unitGroup.rotation.y = rotateY;

            if (type === 'cabinet') {
                const lowerMesh = new THREE.Mesh(lowerGeo, cabMaterial);
                lowerMesh.position.y = -0.05;
                lowerMesh.castShadow = true;
                lowerMesh.receiveShadow = true;
                unitGroup.add(lowerMesh);

                const kickMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 }));
                const kickMesh = new THREE.Mesh(kickGeo, kickMat);
                kickMesh.position.set(0, -0.425, -0.02);
                kickMesh.castShadow = true;
                unitGroup.add(kickMesh);

                const doorMesh = new THREE.Mesh(doorGeo, doorMaterial);
                doorMesh.position.set(0, -0.05, 0.31);
                doorMesh.castShadow = true;
                const doorLine = new THREE.LineSegments(doorEdges, doorLineMat);
                doorMesh.add(doorLine);
                unitGroup.add(doorMesh);

                if (countertop !== 'none') {
                    const topMesh = new THREE.Mesh(topGeo, topMaterial);
                    topMesh.position.y = 0.345;
                    topMesh.castShadow = true;
                    topMesh.receiveShadow = true;
                    unitGroup.add(topMesh);
                }

                if (planHandles.value !== 'gola') {
                    // مقبض دولاب سفلي
                    const handleMesh = new THREE.Mesh(handleGeo, handleMaterial);
                    handleMesh.position.set(0.2, 0.15, 0.33);
                    handleMesh.castShadow = true;
                    unitGroup.add(handleMesh);

                    // مقبض دولاب علوي (يوضع بالأسفل ليسهل الوصول إليه) - لا نكرره في الأركان
                    if (idx !== 0 && idx !== 5) {
                        const upperHandleMesh = new THREE.Mesh(handleGeo, handleMaterial);
                        upperHandleMesh.position.set(0.2, 1.05, 0.07);
                        upperHandleMesh.castShadow = true;
                        unitGroup.add(upperHandleMesh);
                    }
                }

                if (idx === 0) {
                    createLCornerUpperCabinet(unitGroup, 'left-top', cabMaterial, doorMaterial, doorLineMat, handleMaterial, handleGeo);
                } else if (idx === 5) {
                    createLCornerUpperCabinet(unitGroup, 'right-top', cabMaterial, doorMaterial, doorLineMat, handleMaterial, handleGeo);
                } else {
                    const upperMesh = new THREE.Mesh(upperGeo, cabMaterial);
                    upperMesh.position.set(0, 1.25, -0.12);
                    upperMesh.castShadow = true;
                    upperMesh.receiveShadow = true;
                    unitGroup.add(upperMesh);

                    const upperDoorMesh = new THREE.Mesh(upperDoorGeo, doorMaterial);
                    upperDoorMesh.position.set(0, 1.25, 0.05);
                    upperDoorMesh.castShadow = true;
                    const upperDoorLine = new THREE.LineSegments(upperDoorEdges, doorLineMat);
                    upperDoorMesh.add(upperDoorLine);
                    unitGroup.add(upperDoorMesh);

                    const shelfMesh = new THREE.Mesh(shelfGeo, cabMaterial);
                    shelfMesh.position.set(0, 1.25, -0.12);
                    unitGroup.add(shelfMesh);

                    // ضلفة زجاجية واقعية
                    const glassMat = trackMat(new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.05, transmission: 0.6, ior: 1.52 }));
                    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
                    glassMesh.position.set(0, 1.25, 0.061);
                    unitGroup.add(glassMesh);

                    if (hasLed) {
                        const ledMesh = new THREE.Mesh(ledGeo, ledMaterial);
                        ledMesh.position.set(0, 0.89, 0.0);
                        unitGroup.add(ledMesh);

                        // إضاءة صفراء دافئة تسقط على الرخامة (يتم تفعيلها على أجهزة الكمبيوتر فقط لمنع بطء الموبايل)
                        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768);
                        if (!isMobile) {
                            const ledLight = new THREE.PointLight(0xfff5c0, 0.7, 1.5);
                            ledLight.position.set(0, 0.85, 0.0);
                            unitGroup.add(ledLight);
                        }
                    }
                }
            } 
            else if (type === 'sink') {
                const lowerMesh = new THREE.Mesh(lowerGeo, cabMaterial);
                lowerMesh.position.y = -0.05;
                lowerMesh.castShadow = true;
                lowerMesh.receiveShadow = true;
                unitGroup.add(lowerMesh);

                const kickMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 }));
                const kickMesh = new THREE.Mesh(kickGeo, kickMat);
                kickMesh.position.set(0, -0.425, -0.02);
                kickMesh.castShadow = true;
                unitGroup.add(kickMesh);

                const doorMesh = new THREE.Mesh(doorGeo, doorMaterial);
                doorMesh.position.set(0, -0.05, 0.29);
                doorMesh.castShadow = true;
                const doorLine = new THREE.LineSegments(doorEdges, doorLineMat);
                doorMesh.add(doorLine);
                unitGroup.add(doorMesh);

                if (countertop !== 'none') {
                    const topMesh = new THREE.Mesh(topGeo, topMaterial);
                    topMesh.position.y = 0.345;
                    topMesh.castShadow = true;
                    topMesh.receiveShadow = true;
                    unitGroup.add(topMesh);

                    const sinkMesh = new THREE.Mesh(sinkGeo, steelMaterial);
                    sinkMesh.position.set(0, 0.35, 0.05);
                    sinkMesh.castShadow = true;
                    unitGroup.add(sinkMesh);

                    const faucetPost = new THREE.Mesh(faucetPostGeo, steelMaterial);
                    faucetPost.position.set(0, 0.44, -0.08);
                    faucetPost.castShadow = true;
                    unitGroup.add(faucetPost);

                    const faucetArch = new THREE.Mesh(faucetArchGeo, steelMaterial);
                    faucetArch.position.set(0, 0.51, -0.04);
                    faucetArch.castShadow = true;
                    unitGroup.add(faucetArch);

                    const faucetSpout = new THREE.Mesh(faucetSpoutGeo, steelMaterial);
                    faucetSpout.position.set(0, 0.49, 0.0);
                    faucetSpout.castShadow = true;
                    unitGroup.add(faucetSpout);
                }

                // دولاب علوي للمطبقية فوق الحوض (Upper Dish Drainer Cabinet)
                if (idx !== 0 && idx !== 5) {
                    const upperMesh = new THREE.Mesh(upperGeo, cabMaterial);
                    upperMesh.position.set(0, 1.25, -0.12);
                    upperMesh.castShadow = true;
                    upperMesh.receiveShadow = true;
                    unitGroup.add(upperMesh);

                    const upperDoorMesh = new THREE.Mesh(upperDoorGeo, doorMaterial);
                    upperDoorMesh.position.set(0, 1.25, 0.05);
                    upperDoorMesh.castShadow = true;
                    upperDoorMesh.add(new THREE.LineSegments(upperDoorEdges, doorLineMat));
                    unitGroup.add(upperDoorMesh);

                    const glassMat = trackMat(new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.05, transmission: 0.6, ior: 1.52 }));
                    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
                    glassMesh.position.set(0, 1.25, 0.061);
                    unitGroup.add(glassMesh);

                    if (hasLed) {
                        const ledMesh = new THREE.Mesh(ledGeo, ledMaterial);
                        ledMesh.position.set(0, 0.89, 0.0);
                        unitGroup.add(ledMesh);
                    }
                }
            } 
            else if (type === 'cooker') {
                // جسم الفرن والموقد المدمج الفاخر (Built-in Cooker & Oven)
                const cookerGeo = trackGeo(new THREE.BoxGeometry(0.6, 0.75, 0.56));
                const cookerMesh = new THREE.Mesh(cookerGeo, cabMaterial); // يتبع لون خامات المطبخ المختارة
                cookerMesh.position.y = -0.05;
                cookerMesh.castShadow = true;
                cookerMesh.receiveShadow = true;
                unitGroup.add(cookerMesh);

                const kickMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 }));
                const kickMesh = new THREE.Mesh(kickGeo, kickMat);
                kickMesh.position.set(0, -0.425, -0.02);
                kickMesh.castShadow = true;
                unitGroup.add(kickMesh);

                // عيون الموقد السطحية (سيراميك زجاجي مع حواف معدنية)
                const glassTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.58, 0.01, 0.54)), blackGlassMaterial);
                glassTop.position.set(0, 0.33, 0);
                unitGroup.add(glassTop);

                const burner1 = new THREE.Mesh(burnerGeo, steelMaterial);
                burner1.position.set(-0.13, 0.335, -0.1);
                const burner2 = new THREE.Mesh(burnerGeo, steelMaterial);
                burner2.position.set(0.13, 0.335, -0.1);
                const burner3 = new THREE.Mesh(burnerGeo, steelMaterial);
                burner3.position.set(-0.13, 0.335, 0.1);
                const burner4 = new THREE.Mesh(burnerGeo, steelMaterial);
                burner4.position.set(0.13, 0.335, 0.1);
                unitGroup.add(burner1, burner2, burner3, burner4);

                // فرن مدمج سفلي بلمسات مضيئة واقعية (Built-in oven with glow)
                const ovenBody = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.5, 0.45, 0.52)), steelMaterial);
                ovenBody.position.set(0, -0.1, 0.01);
                unitGroup.add(ovenBody);

                const ovenGlass = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.46, 0.36, 0.02)), trackMat(new THREE.MeshPhysicalMaterial({
                    color: 0x111625,
                    transparent: true,
                    opacity: 0.5,
                    roughness: 0.1,
                    transmission: 0.7
                })));
                ovenGlass.position.set(0, -0.1, 0.272);
                unitGroup.add(ovenGlass);

                // إضاءة داخلية دافئة للفرن تعطي انطباعاً بالطهي الفعلي
                const ovenLight = new THREE.PointLight(0xff7700, 0.8, 0.9);
                ovenLight.position.set(0, -0.1, 0.1);
                unitGroup.add(ovenLight);

                const ovenHandle = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.35, 0.015, 0.015)), handleMaterial);
                ovenHandle.position.set(0, 0.1, 0.285);
                unitGroup.add(ovenHandle);

                // الشفاط العلوي ودولاب الشفاط المدمج لتوصيل الخزائن العلوية بالكامل (Upper Hood Cabinet Enclosure)
                const hoodMesh = new THREE.Mesh(hoodGeo, steelMaterial);
                hoodMesh.position.set(0, 1.10, -0.05);
                hoodMesh.castShadow = true;
                unitGroup.add(hoodMesh);

                const chimney = new THREE.Mesh(chimneyGeo, steelMaterial);
                chimney.position.set(0, 1.625, -0.05);
                chimney.castShadow = true;
                unitGroup.add(chimney);

                if (idx !== 0 && idx !== 5) {
                    const upperMesh = new THREE.Mesh(upperGeo, cabMaterial);
                    upperMesh.position.set(0, 1.35, -0.12);
                    upperMesh.castShadow = true;
                    upperMesh.receiveShadow = true;
                    unitGroup.add(upperMesh);

                    const hoodDoorGeo = trackGeo(new THREE.BoxGeometry(0.798, 0.48, 0.02));
                    const upperDoorMesh = new THREE.Mesh(hoodDoorGeo, doorMaterial);
                    upperDoorMesh.position.set(0, 1.36, 0.05);
                    upperDoorMesh.castShadow = true;
                    upperDoorMesh.add(new THREE.LineSegments(trackGeo(new THREE.EdgesGeometry(hoodDoorGeo)), doorLineMat));
                    unitGroup.add(upperDoorMesh);
                }
            } 
            else if (type === 'fridge') {
                // كابينة دولاب الثلاجة الطولية (Fridge Cabinet Body)
                const fridgeCabinet = new THREE.Mesh(fridgeGeo, cabMaterial); // يتبع خامات المطبخ المختارة ليكون مدمجاً بشكل متناسق
                fridgeCabinet.position.y = 0.45;
                fridgeCabinet.castShadow = true;
                fridgeCabinet.receiveShadow = true;
                unitGroup.add(fridgeCabinet);

                // تصميم ثلاجة زجاجية لعرض المشروبات / الأطعمة بإضاءة ليد داخلية مبهرة
                const fridgeDoorGroup = new THREE.Group();
                fridgeDoorGroup.position.set(0, 0.45, 0.31);

                // إطار الباب الألوميتال
                const frameThickness = 0.06;
                const fLeft = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(frameThickness, 1.88, 0.02)), doorMaterial);
                fLeft.position.set(-0.29 + frameThickness/2, 0, 0);
                const fRight = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(frameThickness, 1.88, 0.02)), doorMaterial);
                fRight.position.set(0.29 - frameThickness/2, 0, 0);
                const fTop = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.58, frameThickness, 0.02)), doorMaterial);
                fTop.position.set(0, 0.94 - frameThickness/2, 0);
                const fBottom = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.58, frameThickness, 0.02)), doorMaterial);
                fBottom.position.set(0, -0.94 + frameThickness/2, 0);

                fridgeDoorGroup.add(fLeft, fRight, fTop, fBottom);

                // زجاج عاكس برونزي داكن يحاكي رندرات المطابخ الحديثة
                const glassPaneMat = trackMat(new THREE.MeshPhysicalMaterial({
                    color: 0x15120e,
                    transparent: true,
                    opacity: 0.45,
                    roughness: 0.08,
                    metalness: 0.15,
                    transmission: 0.72,
                    ior: 1.52,
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.05
                }));
                const glassPane = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.58 - frameThickness*2, 1.88 - frameThickness*2, 0.01)), glassPaneMat);
                glassPane.position.set(0, 0, 0);
                fridgeDoorGroup.add(glassPane);
                unitGroup.add(fridgeDoorGroup);

                // أرفف خشبية داخلية دافئة وجميلة
                for (let h = -0.7; h <= 0.7; h += 0.35) {
                    const shelf = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.52, 0.015, 0.45)), trackMat(new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.4 })));
                    shelf.position.set(0, h + 0.45, -0.05);
                    unitGroup.add(shelf);
                }

                // مقبض طولي طويل وأنيق للثلاجة
                const fHandle = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.02, 0.8, 0.02)), handleMaterial);
                fHandle.position.set(-0.23, 0.45, 0.33);
                fHandle.castShadow = true;
                unitGroup.add(fHandle);

                // إضاءة ليد دافئة داخلية
                const fLight = new THREE.PointLight(0xffdfa9, 1.3, 1.6);
                fLight.position.set(0, 0.45, 0.05);
                unitGroup.add(fLight);
            }

            kitchenGroup.add(unitGroup);
        }

            controls.target.set(0, 0.5, 0);
            calculatePlannerEstimate();
            if (typeof window.requestSceneRender === 'function') {
                window.requestSceneRender();
            }
        } catch (err) {
            console.error("Error in update3DFromSketchpad:", err);
            alert("خطأ أثناء تحديث الرسم: " + err.message);
        }
    }

    function calculatePlannerEstimate() {
        if (!isUsingCustomGrid) return;

        let cabCount = 0;
        let sinkCount = 0;
        let cookerCount = 0;
        let fridgeCount = 0;

        gridData.forEach(type => {
            if (type === 'cabinet') cabCount++;
            if (type === 'sink') sinkCount++;
            if (type === 'cooker') cookerCount++;
            if (type === 'fridge') fridgeCount++;
        });

        const style = planStyle.value;
        let cabM2Price = 4500;
        if (style === 'matte-black' || style === 'metallic-gray') cabM2Price = 5200;
        if (style === 'wood-wood') cabM2Price = 4800;

        const cabCost = cabCount * cabM2Price;
        const sinkCost = sinkCount * 5500; 
        const cookerCost = cookerCount * 6500; 
        const fridgeCost = fridgeCount * 12000; 

        const totalCost = Math.round(cabCost + sinkCost + cookerCost + fridgeCost);
        planEstimatedPrice.textContent = totalCost.toLocaleString();

        let adviceText = '';
        if (sinkCount > 0 && cookerCount > 0 && fridgeCount > 0) {
            adviceText = "رائع! قمت بتوزيع العناصر الثلاثة الأساسية لمثلث الحركة (الثلاجة، الحوض، والموقد). ننصح بترك مسافة تتراوح بين 1.2 متر إلى 2.7 متر بين كل من هذه العناصر لضمان سلاسة حركة التحضير والطهي وتجنب التقاطعات.";
        } else {
            adviceText = "لقد قمت برسم توزيع خزائن مطبخك المخصص. للحصول على مثلث حركة مثالي، تأكد من وضع الثلاجة، حوض الغسيل، والموقد في أماكن تتيح لك الحركة بشكل مثلث سلس دون عوائق.";
        }
        triangleAdvice.textContent = adviceText;

        const styleText = planStyle.options[planStyle.selectedIndex].text;
        const countertopText = planCountertop.options[planCountertop.selectedIndex].text;
        colorAdvice.textContent = `التصميم المختار باللون "${styleText}" مع سطح "${countertopText}". هذا التوزيع المخصص يتطلب إنارة ليد موجهة لتسهيل العمل عند حوض الغسيل والموقد بشكل أساسي.`;

        selectedAccList.innerHTML = '';
        const items = [];
        if (cabCount > 0) items.push(`عدد ${cabCount} وحدات خزائن ألوميتال سفلية وعلوية`);
        if (sinkCount > 0) items.push(`عدد ${sinkCount} وحدة حوض غسيل من الاستانلس ستيل`);
        if (cookerCount > 0) items.push(`عدد ${cookerCount} وحدة موقد مدمجة (Built-in)`);
        if (fridgeCount > 0) items.push(`عدد ${fridgeCount} كابينة ثلاجة طولية مدمجة`);
        
        items.forEach(text => {
            const li = document.createElement('li');
            li.textContent = text;
            selectedAccList.appendChild(li);
        });

        plannerEmptyState.style.display = 'none';
        plannerResultsContent.style.display = 'block';

        let whatsappMsg = `مرحباً مهندس التصميم بورشة المهندس، قمت برسم مخطط مطبخي بنفسي عبر لوحة الرسم التفاعلية بصفحة مخطط المطابخ الـ 3D المخصصة:\n`;
        whatsappMsg += `- الستايل والألوان: ${styleText}\n`;
        whatsappMsg += `- التوزيع المرسوم:\n`;
        if (cabCount > 0) whatsappMsg += `  * ${cabCount} وحدات خزائن\n`;
        if (sinkCount > 0) whatsappMsg += `  * ${sinkCount} وحدة حوض غسيل\n`;
        if (cookerCount > 0) whatsappMsg += `  * ${cookerCount} وحدة موقد\n`;
        if (fridgeCount > 0) whatsappMsg += `  * ${fridgeCount} كابينة ثلاجة طولي\n`;
        whatsappMsg += `- السعر التقديري للمخطط المرسوم: ${totalCost.toLocaleString()} ج.م\n`;
        whatsappMsg += `أريد تأكيد التصميم وتحويله لرسم ثلاثي الأبعاد (3D) احترافي، وتحديد موعد للمعاينة الفنية.`;

        sendSpecsWhatsappBtn.href = `https://wa.me/201234567890?text=${encodeURIComponent(whatsappMsg)}`;
    }

    // ==========================================
    // 7. رندرة المطابخ القياسية (تخطيطات جاهزة سريعة)
    // ==========================================
    function update3DKitchen(shape, style, countertop, hasLed) {
        if (!is3DInitialized) return;

        cleanup3DResources();

        // تهيئة المجسمات الهندسية ومشاركتها لجميع الكائنات لمنع تسريب الذاكرة والبطء (Memory Optimization)
        const lowerGeo = trackGeo(new THREE.BoxGeometry(0.8, 0.75, 0.6));
        const kickGeo = trackGeo(new THREE.BoxGeometry(0.8, 0.1, 0.56));
        const doorGeo = trackGeo(new THREE.BoxGeometry(0.798, 0.74, 0.02));
        const doorEdges = trackGeo(new THREE.EdgesGeometry(doorGeo));
        const topGeo = trackGeo(new THREE.BoxGeometry(0.8, 0.04, 0.6));
        const handleGeo = trackGeo(new THREE.BoxGeometry(0.015, 0.12, 0.015));
        const upperGeo = trackGeo(new THREE.BoxGeometry(0.8, 0.7, 0.32));
        const upperDoorGeo = trackGeo(new THREE.BoxGeometry(0.798, 0.68, 0.02));
        const upperDoorEdges = trackGeo(new THREE.EdgesGeometry(upperDoorGeo));
        const glassGeo = trackGeo(new THREE.BoxGeometry(0.66, 0.54, 0.01));
        const ledGeo = trackGeo(new THREE.BoxGeometry(0.74, 0.01, 0.04));
        const doorLineMat = trackMat(new THREE.LineBasicMaterial({ color: 0x111111 }));

        let cabMaterial, doorMaterial;
        let handleColor = 0xd4af37;

        if (style === 'wood-wood') {
            cabMaterial = isFastPerfMode
                ? trackMat(new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.35, metalness: 0.1 }))
                : trackMat(new THREE.MeshPhysicalMaterial({ color: 0x8b5a2b, roughness: 0.35, metalness: 0.1, clearcoat: 0.5, clearcoatRoughness: 0.15 }));
            doorMaterial = cabMaterial;
            handleColor = 0x111111;
        } else if (style === 'glossy-white') {
            cabMaterial = isFastPerfMode
                ? trackMat(new THREE.MeshStandardMaterial({ color: 0xfbfbfb, roughness: 0.1, metalness: 0.1 }))
                : trackMat(new THREE.MeshPhysicalMaterial({ color: 0xfbfbfb, roughness: 0.05, metalness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.05 }));
            doorMaterial = cabMaterial;
            handleColor = 0x9ca3af;
        } else if (style === 'metallic-gray') {
            cabMaterial = trackMat(new THREE.MeshStandardMaterial({ color: 0x4a4d55, roughness: 0.25, metalness: 0.85 }));
            doorMaterial = cabMaterial;
            handleColor = 0x111111;
        } else if (style === 'custom') {
            const customHex = planColorPicker.value;
            const customColorNum = parseInt(customHex.replace('#', '0x'));
            cabMaterial = isFastPerfMode
                ? trackMat(new THREE.MeshStandardMaterial({ color: customColorNum, roughness: 0.25, metalness: 0.4 }))
                : trackMat(new THREE.MeshPhysicalMaterial({ color: customColorNum, roughness: 0.25, metalness: 0.4, clearcoat: 0.85, clearcoatRoughness: 0.05 }));
            doorMaterial = cabMaterial;
            handleColor = 0xd4af37;
        } else {
            cabMaterial = isFastPerfMode
                ? trackMat(new THREE.MeshStandardMaterial({ color: 0x18181c, roughness: 0.5, metalness: 0.7 }))
                : trackMat(new THREE.MeshPhysicalMaterial({ color: 0x18181c, roughness: 0.5, metalness: 0.7, clearcoat: 0.15 }));
            doorMaterial = cabMaterial;
            handleColor = 0xd4af37;
        }

        let marbleColor = 0xffffff;
        if (countertop === 'galaxy-black') marbleColor = 0x111827;
        else if (countertop === 'carrara-gray') marbleColor = 0xd1d5db;

        const topMaterial = trackMat(new THREE.MeshPhysicalMaterial({ 
            color: marbleColor, 
            roughness: 0.1, 
            metalness: 0.15,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
        }));

        const handleMaterial = trackMat(new THREE.MeshStandardMaterial({ color: handleColor, roughness: 0.2, metalness: 0.85 }));
        const ledMaterial = trackMat(new THREE.MeshBasicMaterial({ color: 0xfffca1 }));
        const glassMat = trackMat(new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.05, transmission: 0.6, ior: 1.52 }));

        function createCabinetUnit(x, z, rotateY = 0, isIsland = false, cornerType = null) {
            const unitGroup = new THREE.Group();
            unitGroup.position.set(x, -0.05, z);
            unitGroup.rotation.y = rotateY;

            const lowerMesh = new THREE.Mesh(lowerGeo, cabMaterial);
            lowerMesh.position.y = -0.05;
            lowerMesh.castShadow = true;
            lowerMesh.receiveShadow = true;
            unitGroup.add(lowerMesh);

            const kickMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 }));
            const kickMesh = new THREE.Mesh(kickGeo, kickMat);
            kickMesh.position.set(0, -0.425, -0.02);
            kickMesh.castShadow = true;
            unitGroup.add(kickMesh);

            const doorMesh = new THREE.Mesh(doorGeo, doorMaterial);
            doorMesh.position.set(0, -0.05, 0.31);
            doorMesh.castShadow = true;
            const doorLine = new THREE.LineSegments(doorEdges, doorLineMat);
            doorMesh.add(doorLine);
            unitGroup.add(doorMesh);

            if (countertop !== 'none') {
                const topMesh = new THREE.Mesh(topGeo, topMaterial);
                topMesh.position.y = 0.345;
                topMesh.castShadow = true;
                topMesh.receiveShadow = true;
                unitGroup.add(topMesh);
            }

            if (planHandles.value !== 'gola') {
                // مقبض دولاب سفلي
                const handleMesh = new THREE.Mesh(handleGeo, handleMaterial);
                handleMesh.position.set(0.3, 0.15, 0.33);
                handleMesh.castShadow = true;
                unitGroup.add(handleMesh);

                if (!isIsland && !cornerType) {
                    // مقبض دولاب علوي (يوضع بالأسفل ليسهل الوصول إليه)
                    const upperHandleMesh = new THREE.Mesh(handleGeo, handleMaterial);
                    upperHandleMesh.position.set(0.3, 1.05, 0.07);
                    upperHandleMesh.castShadow = true;
                    unitGroup.add(upperHandleMesh);
                }
            }

            if (!isIsland) {
                if (cornerType) {
                    createLCornerUpperCabinet(unitGroup, cornerType, cabMaterial, doorMaterial, doorLineMat, handleMaterial, handleGeo);
                } else {
                    const upperMesh = new THREE.Mesh(upperGeo, cabMaterial);
                    upperMesh.position.set(0, 1.25, -0.12);
                    upperMesh.castShadow = true;
                    upperMesh.receiveShadow = true;
                    unitGroup.add(upperMesh);

                    const upperDoorMesh = new THREE.Mesh(upperDoorGeo, doorMaterial);
                    upperDoorMesh.position.set(0, 1.25, 0.05);
                    upperDoorMesh.castShadow = true;
                    const upperDoorLine = new THREE.LineSegments(upperDoorEdges, doorLineMat);
                    upperDoorMesh.add(upperDoorLine);
                    unitGroup.add(upperDoorMesh);

                    const shelfGeo = trackGeo(new THREE.BoxGeometry(0.76, 0.015, 0.28));
                    const shelfMesh = new THREE.Mesh(shelfGeo, cabMaterial);
                    shelfMesh.position.set(0, 1.25, -0.12);
                    unitGroup.add(shelfMesh);

                    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
                    glassMesh.position.set(0, 1.25, 0.061);
                    unitGroup.add(glassMesh);

                    if (hasLed) {
                        const ledMesh = new THREE.Mesh(ledGeo, ledMaterial);
                        ledMesh.position.set(0, 0.89, 0.0);
                        unitGroup.add(ledMesh);

                        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768);
                        if (!isMobile) {
                            const ledLight = new THREE.PointLight(0xfff5c0, 0.7, 1.5);
                            ledLight.position.set(0, 0.85, 0.0);
                            unitGroup.add(ledLight);
                        }
                    }
                }
            }

            kitchenGroup.add(unitGroup);
        }

        if (shape === 'straight') {
            createCabinetUnit(-1.2, -1);
            createCabinetUnit(-0.4, -1);
            createCabinetUnit(0.4, -1);
            createCabinetUnit(1.2, -1);
            controls.target.set(0, 0.5, -1);
        } 
        else if (shape === 'l-shape') {
            createCabinetUnit(-0.6, -1); // ملتصق تماماً بمركز الخط الخلفي
            createCabinetUnit(0, -1);
            createCabinetUnit(0.6, -1, 0, false, 'right-top'); // ركنة علوية مخصصة متلاحمة L
            createCabinetUnit(0.6, -0.2, -Math.PI / 2); // ملتصق تماماً 100% بالركنة بدون أي فواصل
            createCabinetUnit(0.6, 0.6, -Math.PI / 2);
            controls.target.set(0, 0.5, -0.2);
        } 
        else if (shape === 'u-shape') {
            createCabinetUnit(-0.6, -1, 0, false, 'left-top'); // ركنة علوية يسرى مخصصة متلاحمة L
            createCabinetUnit(0, -1);
            createCabinetUnit(0.6, -1, 0, false, 'right-top'); // ركنة علوية يمنى مخصصة متلاحمة L
            createCabinetUnit(0.6, -0.2, -Math.PI / 2); // ملتصق تماماً 100% بالجانب الأيمن
            createCabinetUnit(0.6, 0.6, -Math.PI / 2);
            createCabinetUnit(-0.6, -0.2, Math.PI / 2);  // ملتصق تماماً 100% بالجانب الأيسر
            createCabinetUnit(-0.6, 0.6, Math.PI / 2);
            controls.target.set(0, 0.5, -0.2);
        } 
        else if (shape === 'island') {
            createCabinetUnit(-1.2, -1.2);
            createCabinetUnit(-0.4, -1.2);
            createCabinetUnit(0.4, -1.2);
            createCabinetUnit(1.2, -1.2);
            createCabinetUnit(-0.4, 0.4, 0, true);
            createCabinetUnit(0.4, 0.4, 0, true);
            controls.target.set(0, 0.5, -0.4);
        }

        if (typeof window.requestSceneRender === 'function') {
            window.requestSceneRender();
        }
    }

    generateBtn.addEventListener('click', () => {
        if (isUsingCustomGrid) {
            visualizerLoader.style.display = 'flex';
            visualizerLoader.querySelector('span').textContent = "جاري مراجعة مخططك التفاعلي وبناء مجسم 3D نهائي...";
            setTimeout(() => {
                visualizerLoader.style.display = 'none';
                update3DFromSketchpad();
            }, 800);
            return;
        }

        const shape = planShape.value;
        const style = planStyle.value;
        const wall1 = parseFloat(planWall1.value) || 0;
        const wall2 = parseFloat(planWall2.value) || 0;
        const handles = planHandles.value;
        const countertop = planCountertop.value;
        
        if (wall1 <= 0 || ((shape === 'l-shape' || shape === 'u-shape') && wall2 <= 0)) {
            alert('الرجاء إدخال مقاسات صحيحة للجدران!');
            return;
        }

        visualizerLoader.style.display = 'flex';
        const loaderText = visualizerLoader.querySelector('span');
        const hasSketch = sketchUpload.files.length > 0;
        
        if (hasSketch) {
            loaderText.textContent = "جاري قراءة خطوط المخطط المرفوع وتحديد الزوايا...";
            setTimeout(() => { loaderText.textContent = "جاري حساب الأبعاد وتوزيع وحدات التخزين..."; }, 600);
            setTimeout(() => { loaderText.textContent = "جاري رندرة المجسم ثلاثي الأبعاد للمطبخ..."; }, 1200);
        } else {
            loaderText.textContent = "جاري توزيع الأجهزة وبناء المطبخ...";
            setTimeout(() => { loaderText.textContent = "جاري رندرة المجسم ثلاثي الأبعاد للمطبخ..."; }, 600);
        }

        setTimeout(() => {
            visualizerLoader.style.display = 'none';

            let movementAdviceText = '';
            if (shape === 'straight') {
                movementAdviceText = `في المطبخ المستقيم بمقاس ${wall1} م، يتم ترتيب الأجهزة على خط واحد. ننصح بوضع حوض الغسيل في المنتصف يفصل بين الثلاجة (في الطرف الأيمن) والموقد (في الطرف الأيسر) لضمان مساحة عمل كافية للتحضير بطول لا يقل عن 80 سم بينهما.`;
            } else if (shape === 'l-shape') {
                movementAdviceText = `التخطيط على شكل حرف L بمقاس ${wall1}م × ${wall2}م يوفر مثلث حركة مثالي جداً. ننصح بوضع حوض الغسيل على الجدار الرئيسي والموقد على الجدار الجانبي، بينما توضع الثلاجة في بداية الجدار الرئيسي بالقرب من الباب لسهولة تفريغ الأطعمة.`;
            } else if (shape === 'u-shape') {
                movementAdviceText = `تخطيط حرف U بمقاس ${wall1}م × ${wall2}م يوفر أعلى كفاءة للمطابخ الكبيرة. ننصح بوضع حوض الغسيل في قاعدة الحرف U (الجدار الأوسط تحت النافذة إن وجدت)، ووضع الموقد على جدار والثلاجة على الجدار المقابل لتقليل مسافات الحركة أثناء الطهي.`;
            } else if (shape === 'island') {
                movementAdviceText = `مطبخ الجزيرة بمقاس ${wall1} م هو قمة تصاميم 2026. نقترح جعل الموقد مدمجاً في الجزيرة الوسطية مع شفاط معلق حديث، وجعل حوض الغسيل والثلاجة على الجدار الخلفي لتوفير مساحة تفاعل ممتازة أثناء إعداد الطعام.`;
            }

            let colorMatchingText = '';
            const styleText = planStyle.options[planStyle.selectedIndex].text;
            const countertopText = planCountertop.options[planCountertop.selectedIndex].text;

            if (style === 'matte-black') {
                colorMatchingText = `اخترت ستايل "${styleText}" مع "${countertopText}". هذا التناسق يمثل قمة الفخامة العصرية لعام 2026. ننصح بإضافة لمسات خشبية دافئة في الرفوف المفتوحة لكسر حدة اللون الأسود، واستخدم إضاءة ليد دافئة (Warm LED 3000K) لتبرز جمال الأسطح المطفية المقاومة للبصمات.`;
            } else if (style === 'wood-wood') {
                colorMatchingText = `اخترت ستايل "${styleText}" مع "${countertopText}". هذا التصميم يجمع بين دفء الطبيعة وعملية الألومنيوم المقاوم للماء. ننصح باختيار أجهزة كهربائية بلون أسود مطفي وتجنب الألوان اللامعة الزائدة، مع إضاءة ليد بيضاء هادئة (4000K) لإبراز تفاصيل العروق الخشبية.`;
            } else if (style === 'glossy-white') {
                colorMatchingText = `اخترت ستايل "${styleText}" مع "${countertopText}". يعطي هذا التناسق إيحاءً بالاتساع والنظافة ويناسب المساحات الصغيرة والمتوسطة. ننصح بدمج درجات رمادية خفيفة أو زجاج عاكس برونزي في الوحدات العلوية، واستخدم إضاءة ليد مدمجة ذكية تضيء الأرفف الداخلية تلقائياً.`;
            } else if (style === 'metallic-gray') {
                colorMatchingText = `اخترت ستايل "${styleText}" مع "${countertopText}". يعطيك هذا الستايل مظهر المطبخ الاحترافي لعام 2026. ننصح باستخدام إكسسوارات وحوض غسيل من الاستانلس ستيل المطلي باللون الرمادي الداكن (Gunmetal Gray) ليتناغم تماماً مع القطاعات التيتانيوم المطفية.`;
            }

            selectedAccList.innerHTML = '';
            let selectedAccNames = [];
            const checkboxes = document.querySelectorAll('.plan-acc:checked');
            let hasLed = false;
            
            checkboxes.forEach(cb => {
                const labelText = cb.closest('.checkbox-container').textContent.trim();
                selectedAccNames.push(labelText);
                const li = document.createElement('li');
                li.textContent = labelText;
                selectedAccList.appendChild(li);
                if (cb.value === 'led-under') hasLed = true;
            });

            if (selectedAccNames.length === 0) {
                const li = document.createElement('li');
                li.textContent = 'خزائن داخلية أساسية بدون ملحقات إضافية.';
                selectedAccList.appendChild(li);
            }

            let estimatedArea = 0;
            let baseM2Price = 5200;
            
            if (style === 'matte-black' || style === 'metallic-gray') baseM2Price = 5800;
            if (style === 'wood-wood') baseM2Price = 5400;
            
            if (shape === 'straight') {
                estimatedArea = wall1 * 1.6;
            } else if (shape === 'l-shape') {
                estimatedArea = (wall1 + wall2 - 0.6) * 1.6;
            } else if (shape === 'u-shape') {
                estimatedArea = (wall1 + (wall2 * 2) - 1.2) * 1.6;
            } else if (shape === 'island') {
                estimatedArea = (wall1 * 1.6) + (2.0 * 0.9);
            }

            let baseCost = estimatedArea * baseM2Price;
            
            let marbleCost = 0;
            let marbleM2Price = 0;
            if (countertop === 'quartz-white') marbleM2Price = 4500;
            else if (countertop === 'galaxy-black') marbleM2Price = 3800;
            else if (countertop === 'carrara-gray') marbleM2Price = 5500;
            
            if (countertop !== 'none') {
                const bottomLength = (shape === 'straight') ? wall1 : (shape === 'l-shape') ? (wall1 + wall2 - 0.6) : (shape === 'u-shape') ? (wall1 + (wall2 * 2) - 1.2) : wall1;
                marbleCost = bottomLength * 0.6 * marbleM2Price;
                if (shape === 'island') {
                    marbleCost += 2.0 * 0.9 * marbleM2Price;
                }
            }

            let accCost = 0;
            checkboxes.forEach(cb => {
                if (cb.value === 'hydraulic-rack') accCost += 2800;
                if (cb.value === 'lazy-susan') accCost += 4200;
                if (cb.value === 'pantry-tall') accCost += 7500;
                if (cb.value === 'led-under') accCost += 2000;
            });

            if (handles === 'gola') baseCost += baseCost * 0.08;

            const finalPlanPrice = Math.round(baseCost + marbleCost + accCost);
            
            triangleAdvice.textContent = movementAdviceText;
            colorAdvice.textContent = colorMatchingText;
            planEstimatedPrice.textContent = finalPlanPrice.toLocaleString();
            
            plannerEmptyState.style.display = 'none';
            plannerResultsContent.style.display = 'block';

            if (!is3DInitialized) {
                init3DVisualizer();
            }

            update3DKitchen(shape, style, countertop, hasLed);

            let whatsappMsg = `مرحباً مهندس التصميم بورشة المهندس، قمت بإدخال مواصفات مطبخي للحصول على رسم 3D مقترح:\n`;
            if (hasSketch) {
                whatsappMsg += `[لقد قمت برفع كروكي مرسوم للمقاسات لتنفيذه في الـ 3D]\n`;
            }
            whatsappMsg += `- شكل المطبخ: ${planShape.options[planShape.selectedIndex].text}\n`;
            if (shape === 'straight' || shape === 'island') {
                whatsappMsg += `- الأبعاد: جدار رئيسي بطول ${wall1} م\n`;
            } else {
                whatsappMsg += `- الأبعاد: جدار رئيسي ${wall1} م × جدار جانبي ${wall2} م\n`;
            }
            whatsappMsg += `- الستايل والألوان: ${styleText}\n`;
            whatsappMsg += `- المقابض: ${planHandles.options[planHandles.selectedIndex].text}\n`;
            whatsappMsg += `- نوع الرخام: ${countertopText}\n`;
            if (selectedAccNames.length > 0) {
                whatsappMsg += `- الإكسسوارات المطلوبة: ${selectedAccNames.join('، ')}\n`;
            }
            whatsappMsg += `- التكلفة المقترحة المحسوبة: ${finalPlanPrice.toLocaleString()} ج.م\n`;
            whatsappMsg += `أريد تأكيد طلب التصميم ثلاثي الأبعاد المجاني والاتفاق على زيارة المعاينة ورفع المقاسات الفنية.`;

            sendSpecsWhatsappBtn.href = `https://wa.me/201234567890?text=${encodeURIComponent(whatsappMsg)}`;
        }, hasSketch ? 1800 : 800);
    });

    // تهيئة مساحة العرض وتعبئة المخطط الافتراضي (U-Shape) عند التحميل
    setTimeout(() => {
        if (!is3DInitialized) {
            init3DVisualizer();
        }
        // تعيين شكل المطبخ ليكون U-Shape كبداية توضيحية لجمال الزوايا والتلاحم
        planShape.value = 'u-shape';
        planShape.dispatchEvent(new Event('change'));
    }, 100);
});



