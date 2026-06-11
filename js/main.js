// --- CONFIGURACIÓN DE INTEGRACIÓN ---
const CONFIG = {
    // Coloca aquí la URL de la aplicación web de Google Apps Script (e.g. https://script.google.com/macros/s/.../exec)
    googleSheetUrl: 'https://script.google.com/macros/s/AKfycbwcAsas4KScsP9ZSwx3a-hiQQd2UTV8wCNqceN2bFPrZm5mmPCFWabLdFyW4aN8Rn_DLw/exec',
    // Coloca aquí el número de teléfono de WhatsApp que recibirá las confirmaciones (sin el '+', con código de país. Ej: 525512345678)
    whatsappPhone: '525521093779'
};

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. COUNTDOWN TIMER ---
    // Target date: July 25, 2026, 16:00:00 (Time of Ceremony)
    const countDownDate = new Date("Jul 25, 2026 16:00:00").getTime();

    const updateTimer = setInterval(() => {
        const now = new Date().getTime();
        const distance = countDownDate - now;

        if (distance < 0) {
            clearInterval(updateTimer);
            document.getElementById("timer").innerHTML = "<div class='time-box'><span>¡Ya</span><p>llegó</p></div><div class='time-box'><span>el</span><p>día!</p></div>";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById("days").innerText = days.toString().padStart(2, '0');
        document.getElementById("hours").innerText = hours.toString().padStart(2, '0');
        document.getElementById("minutes").innerText = minutes.toString().padStart(2, '0');
        document.getElementById("seconds").innerText = seconds.toString().padStart(2, '0');
    }, 1000);

    // --- 2. CAROUSEL LOGIC ---
    // Instead of external placeholders, we assume images are stored locally in 'assets/gallery' or similarly
    // We will inject actual generated paths here shortly, but for now we setup structure.
    const carouselImages = [
        "assets/img/carousel_1.png",
        "assets/img/carousel_2.png",
        "assets/img/carousel_3.png"
    ];

    const track = document.getElementById('carousel-track');
    const indicatorsCont = document.getElementById('carousel-indicators');
    let currentIndex = 0;

    // Initialize Carousel
    carouselImages.forEach((imgSrc, index) => {
        // Create img
        const img = document.createElement('img');
        img.src = imgSrc;
        img.className = 'carousel-slide';
        img.alt = `Galería ${index + 1}`;
        track.appendChild(img);

        // Create indicator
        const dot = document.createElement('div');
        dot.className = `indicator ${index === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => goToSlide(index));
        indicatorsCont.appendChild(dot);
    });

    const updateCarousel = () => {
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        const dots = indicatorsCont.querySelectorAll('.indicator');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    };

    const nextSlide = () => {
        currentIndex = (currentIndex + 1) % carouselImages.length;
        updateCarousel();
    };

    const prevSlide = () => {
        currentIndex = (currentIndex - 1 + carouselImages.length) % carouselImages.length;
        updateCarousel();
    };

    document.getElementById('carousel-next').addEventListener('click', () => { nextSlide(); resetAutoplay(); });
    document.getElementById('carousel-prev').addEventListener('click', () => { prevSlide(); resetAutoplay(); });

    // Autoplay
    let autoplayInterval = setInterval(nextSlide, 4000);
    const resetAutoplay = () => {
        clearInterval(autoplayInterval);
        autoplayInterval = setInterval(nextSlide, 4000);
    };

    function goToSlide(index) {
        currentIndex = index;
        updateCarousel();
        resetAutoplay();
    }

    // --- 3. PHOTO UPLOAD UI SIMULATION ---
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const uploadPreview = document.getElementById('upload-preview');

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Función para procesar y optimizar imágenes sin reducir más del 30% de su calidad o peso (calidad 0.80, max 4000px)
    function compressAndReadFile(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                // Para videos u otros formatos admitidos (ej: MP4), leer directamente como base64
                const reader = new FileReader();
                reader.onload = (e) => resolve({
                    base64Data: e.target.result,
                    fileName: file.name,
                    mimeType: file.type
                });
                reader.onerror = (err) => reject(err);
                reader.readAsDataURL(file);
                return;
            }

            // Para imágenes, optimizar utilizando Canvas manteniendo alta fidelidad (máx. 20% de reducción de calidad)
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_WIDTH = 4000; // Resolución alta (hasta 12MP/4K) para no reducir peso/dimensiones en más de 30%
                    const MAX_HEIGHT = 4000;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Exportar como JPEG con calidad 0.80 (20% de reducción de calidad, garantizando mantener al menos el 80% de calidad)
                    const base64Data = canvas.toDataURL('image/jpeg', 0.80);
                    resolve({
                        base64Data: base64Data,
                        fileName: file.name.replace(/\.[^/.]+$/, "") + ".jpg", // Guardar como .jpg
                        mimeType: 'image/jpeg'
                    });
                };
                img.src = event.target.result;
            };
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    }

    async function handleFiles(files) {
        const fileList = Array.from(files);
        if (fileList.length === 0) return;

        // Limitar la subida a un máximo de 10 archivos por lote
        if (fileList.length > 10) {
            alert('Para garantizar una subida rápida y exitosa, puedes subir un máximo de 10 archivos a la vez. Por favor, selecciona menos archivos.');
            fileInput.value = '';
            return;
        }

        const normalContent = document.getElementById('upload-normal-content');
        const loadingContent = document.getElementById('upload-loading-content');
        const loadingText = document.getElementById('upload-loading-text');

        // Mostrar el estado de carga y bloquear clics
        if (normalContent && loadingContent) {
            normalContent.classList.add('hidden-message');
            loadingContent.classList.remove('hidden-message');
        }
        uploadArea.style.pointerEvents = 'none';

        let uploadedCount = 0;
        const totalFiles = fileList.length;

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];

            // Actualizar contador del proceso
            if (loadingText) {
                loadingText.innerText = `Subiendo archivos (${i + 1}/${totalFiles})...`;
            }

            try {
                // Procesar (comprimir si es imagen)
                const fileData = await compressAndReadFile(file);

                // Enviar al Apps Script
                const response = await fetch(CONFIG.googleSheetUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8' // Evita preflight
                    },
                    body: JSON.stringify({
                        action: 'upload',
                        fileName: fileData.fileName,
                        mimeType: fileData.mimeType,
                        base64Data: fileData.base64Data
                    })
                });

                const result = await response.json();

                if (result.status === 'success') {
                    uploadedCount++;

                    // Mostrar preview de la foto con un badge de "Subido"
                    const previewWrapper = document.createElement('div');
                    previewWrapper.className = 'preview-wrapper';

                    const img = document.createElement('img');
                    img.src = fileData.base64Data;
                    img.classList.add('preview-item');

                    const badge = document.createElement('span');
                    badge.className = 'upload-badge';
                    badge.innerHTML = "<i class='bx bx-check'></i>";

                    previewWrapper.appendChild(img);
                    previewWrapper.appendChild(badge);
                    uploadPreview.appendChild(previewWrapper);
                }
            } catch (error) {
                console.error('Error al subir archivo:', file.name, error);
            }
        }

        // Restablecer el área de carga (ocultar loader)
        if (normalContent && loadingContent) {
            normalContent.classList.remove('hidden-message');
            loadingContent.classList.add('hidden-message');
        }
        uploadArea.style.pointerEvents = 'auto';
        
        // ¡CRÍTICO!: Limpiar el valor del input para poder subir los mismos archivos nuevamente
        fileInput.value = '';

        // Mostrar alerta/aviso temporal
        if (uploadedCount > 0) {
            alert(`¡Se han subido ${uploadedCount} foto(s) con éxito muchas gracias por compartir! 🎉`);
        } else {
            alert('Hubo un problema al subir las fotos. Por favor inténtalo de nuevo.');
        }
    }

    // --- 4. BUTTERFLY GENERATOR ---
    const butterflyContainer = document.getElementById('butterfly-container');

    function createButterfly() {
        const wrapper = document.createElement('div');
        wrapper.classList.add('butterfly-wrapper');

        const rotator = document.createElement('div');
        rotator.classList.add('butterfly-rotator');

        const butterfly = document.createElement('div');
        butterfly.classList.add('butterfly-3d');

        // Add 3D wings, body and antennae
        butterfly.innerHTML = `
            <div class="wing left"></div>
            <div class="wing right"></div>
            <div class="butterfly-body"></div>
            <div class="butterfly-antennae"></div>
        `;

        rotator.appendChild(butterfly);
        wrapper.appendChild(rotator);

        // Size: Increased by 30px from previous: now 70px to 120px
        const size = Math.random() * 50 + 70;
        wrapper.style.width = `${size}px`;
        wrapper.style.height = `${size}px`;

        // Random starting edge (0: top, 1: right, 2: bottom, 3: left)
        const edge = Math.floor(Math.random() * 4);
        let startX, startY, endX, endY;

        // Define varied trajectories that cross the screen
        if (edge === 0) { // Top
            startX = Math.random() * 100; startY = -20;
            endX = Math.random() * 100; endY = 120;
        } else if (edge === 1) { // Right
            startX = 120; startY = Math.random() * 100;
            endX = -20; endY = Math.random() * 100;
        } else if (edge === 2) { // Bottom
            startX = Math.random() * 100; startY = 120;
            endX = Math.random() * 100; endY = -20;
        } else { // Left
            startX = -20; startY = Math.random() * 100;
            endX = 120; endY = Math.random() * 100;
        }

        wrapper.style.left = `${startX}vw`;
        wrapper.style.top = `${startY}vh`;

        wrapper.style.setProperty('--tx', `${endX - startX}vw`);
        wrapper.style.setProperty('--ty', `${endY - startY}vh`);

        // Rotate butterfly to face the direction of flight
        // We assume the SVG points upwards. So facing right is 90deg.
        const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
        rotator.style.transform = `rotate(${angle + 90}deg)`;

        // Adjust duration based on distance so they don't look awkwardly fast or slow
        // An immersive average flight speed
        const duration = Math.random() * 12 + 15; // 15s to 27s
        wrapper.style.animationDuration = `${duration}s`;

        // Randomize flutter speed slightly to look more organic
        const flutterSpeed = Math.random() * 0.15 + 0.15; // 0.15s to 0.3s
        butterfly.querySelector('.left').style.animationDuration = `${flutterSpeed}s`;
        butterfly.querySelector('.right').style.animationDuration = `${flutterSpeed}s`;

        butterflyContainer.appendChild(wrapper);

        // Remove element after animation completes
        setTimeout(() => {
            wrapper.remove();
        }, duration * 1000);
    }

    // Generate at intervals
    setInterval(createButterfly, 2500);

    // Initial batch
    for (let i = 0; i < 6; i++) {
        setTimeout(createButterfly, Math.random() * 4000);
    }

    // --- 3.5 LOGIN & PERSONALIZATION FLOW ---
    const loginScreen = document.getElementById('login-screen');
    const loginStep = document.getElementById('login-step');
    const welcomeStep = document.getElementById('welcome-step');
    
    const loginForm = document.getElementById('login-form');
    const loginPinInput = document.getElementById('login-pin');
    const loginError = document.getElementById('login-error');
    const loginBtn = document.getElementById('login-btn');
    
    const welcomeGuestName = document.getElementById('welcome-guest-name');
    const welcomePassesInfo = document.getElementById('welcome-passes-info');
    const btnShowInvitation = document.getElementById('btn-show-invitation');
    
    const rsvpGuestName = document.getElementById('guest-name');
    const rsvpGuestLimit = document.getElementById('guest-limit');
    const rsvpGuestConfirm = document.getElementById('guest-confirm');
    const rsvpAttendance = document.getElementById('guest-attendance');
    const confirmCompanionsGroup = document.getElementById('confirm-companions-group');

    let tempPin = ""; // Almacena temporalmente el PIN antes de confirmarlo en localStorage

    // Habilitar o deshabilitar acompañantes según respuesta de asistencia
    if (rsvpAttendance) {
        rsvpAttendance.addEventListener('change', () => {
            if (rsvpAttendance.value === 'no') {
                confirmCompanionsGroup.style.display = 'none';
                rsvpGuestConfirm.removeAttribute('required');
                rsvpGuestConfirm.value = '0';
            } else {
                confirmCompanionsGroup.style.display = 'block';
                rsvpGuestConfirm.setAttribute('required', 'required');
                rsvpGuestConfirm.value = '';
            }
        });
    }

    // Función para rellenar la personalización una vez validado el invitado
    function applyPersonalization(guestData) {
        // 1. Mostrar datos en el paso de bienvenida (flotante)
        if (welcomeGuestName) welcomeGuestName.innerText = guestData.guestName;
        
        let pasesText = "";
        if (guestData.passesLimit === 0) {
            pasesText = "Tienes pase para ti individualmente (sin acompañantes adicionales).";
        } else if (guestData.passesLimit === 1) {
            pasesText = "Tienes pase para ti + <strong>1 acompañante</strong> adicional.";
        } else {
            pasesText = `Tienes pases para ti + <strong>${guestData.passesLimit} acompañantes</strong> adicionales.`;
        }
        if (welcomePassesInfo) welcomePassesInfo.innerHTML = pasesText;
        
        // 2. Rellenar campos del formulario de RSVP
        if (rsvpGuestName) rsvpGuestName.value = guestData.guestName;
        if (rsvpGuestLimit) rsvpGuestLimit.value = guestData.passesLimit === 0 ? "Solo tú" : `${guestData.passesLimit} acompañantes adicionales`;
        
        // 3. Crear opciones dinámicas para el select de acompañantes confirmados
        if (rsvpGuestConfirm) {
            rsvpGuestConfirm.innerHTML = '<option value="" disabled selected>Selecciona cantidad...</option>';
            
            // Opción 0 acompañantes (siempre presente)
            const optZero = document.createElement('option');
            optZero.value = '0';
            optZero.innerText = 'Solo yo (0 acompañantes adicionales)';
            rsvpGuestConfirm.appendChild(optZero);
            
            for (let j = 1; j <= guestData.passesLimit; j++) {
                const opt = document.createElement('option');
                opt.value = j.toString();
                opt.innerText = `${j} acompañante${j > 1 ? 's' : ''}`;
                rsvpGuestConfirm.appendChild(opt);
            }
        }
    }

    // Validar PIN ingresado contra el Apps Script
    async function validatePin(pin) {
        if (pin === 'FOTOS') {
            return {
                status: 'success',
                guestName: 'Invitado Especial (Fotos)',
                passesLimit: 0,
                alreadyConfirmed: false,
                isPhotosOnly: true
            };
        }
        const response = await fetch(CONFIG.googleSheetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify({
                action: 'getGuest',
                pin: pin
            })
        });
        return await response.json();
    }

    // Intentar autologin si ya hay PIN guardado
    const savedPin = localStorage.getItem('sofi_invite_pin');
    if (savedPin) {
        // Ocultar pantalla inmediatamente para que no parpadee si es válido
        loginScreen.style.display = 'none';
        
        validatePin(savedPin).then(result => {
            if (result.status === 'success') {
                applyPersonalization(result);
                if (result.isPhotosOnly) {
                    const rsvpSec = document.getElementById('rsvp');
                    if (rsvpSec) rsvpSec.style.display = 'none';
                    
                    // Hacer scroll suave a fotos después de que cargue la página
                    setTimeout(() => {
                        const uploadSec = document.getElementById('upload');
                        if (uploadSec) {
                            uploadSec.scrollIntoView({ behavior: 'smooth' });
                        }
                    }, 500);
                }
            } else {
                // Si el PIN guardado ya no es válido, limpiar y volver a mostrar login
                localStorage.removeItem('sofi_invite_pin');
                loginScreen.style.display = 'flex';
                loginScreen.classList.remove('hidden-message');
                loginStep.classList.remove('hidden-message');
                welcomeStep.classList.add('hidden-message');
            }
        }).catch(err => {
            console.error("Error al autologear PIN:", err);
            loginScreen.style.display = 'flex';
            loginScreen.classList.remove('hidden-message');
            loginStep.classList.remove('hidden-message');
            welcomeStep.classList.add('hidden-message');
        });
    }

    // Evento del formulario de Login (Paso 1)
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const pinVal = loginPinInput.value.trim().toUpperCase();
            if (!pinVal) return;
            
            // Retroalimentación de carga
            loginBtn.disabled = true;
            const originalBtnText = loginBtn.innerHTML;
            loginBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Verificando...";
            loginError.classList.add('hidden-message');
            
            try {
                const result = await validatePin(pinVal);
                if (result.status === 'success') {
                    // Si el PIN es FOTOS, omitir bienvenida e ir directo al cargador de fotos
                    if (result.isPhotosOnly) {
                        localStorage.setItem('sofi_invite_pin', 'FOTOS');
                        
                        const rsvpSec = document.getElementById('rsvp');
                        if (rsvpSec) rsvpSec.style.display = 'none';
                        
                        loginScreen.classList.add('hidden-message');
                        setTimeout(() => {
                            loginScreen.style.display = 'none';
                            const uploadSec = document.getElementById('upload');
                            if (uploadSec) {
                                uploadSec.scrollIntoView({ behavior: 'smooth' });
                            }
                        }, 600);
                        return;
                    }

                    tempPin = pinVal; // Guardar temporalmente el PIN
                    
                    // Aplicar personalización
                    applyPersonalization(result);
                    
                    // Ocultar el formulario de ingreso de PIN e iniciar la bienvenida
                    loginStep.classList.add('hidden-message');
                    welcomeStep.classList.remove('hidden-message');
                } else {
                    loginError.innerText = result.message || "PIN incorrecto o no registrado.";
                    loginError.classList.remove('hidden-message');
                }
            } catch (err) {
                console.error("Error al validar PIN:", err);
                loginError.innerText = "Error de conexión. Por favor inténtalo de nuevo.";
                loginError.classList.remove('hidden-message');
            } finally {
                loginBtn.disabled = false;
                loginBtn.innerHTML = originalBtnText;
            }
        });
    }

    // Evento del botón "Ver Invitación" (Paso 2)
    if (btnShowInvitation) {
        btnShowInvitation.addEventListener('click', () => {
            if (tempPin) {
                localStorage.setItem('sofi_invite_pin', tempPin);
            }
            // Desvanecer toda la pantalla de acceso
            loginScreen.classList.add('hidden-message');
            setTimeout(() => {
                loginScreen.style.display = 'none';
            }, 600);
        });
    }

});

// --- 5. BACKGROUND AUDIO (TRADITIONAL) ---
const bgAudio = document.getElementById('bg-audio');
const btnPlay = document.getElementById('btn-play');
const btnPause = document.getElementById('btn-pause');

if (bgAudio && btnPlay && btnPause) {
    bgAudio.volume = 0.5; // Set to 50% for background ambient music

    // Saltar los primeros 3 segundos (retraso/silencio inicial) de forma segura en el primer inicio
    let hasSetInitialTime = false;
    const setInitialTime = () => {
        if (!hasSetInitialTime) {
            bgAudio.currentTime = 3;
            hasSetInitialTime = true;
        }
    };
    bgAudio.addEventListener('loadedmetadata', setInitialTime);
    bgAudio.addEventListener('play', setInitialTime);

    btnPlay.addEventListener('click', () => {
        bgAudio.play().then(() => {
            btnPlay.classList.add('active');
            btnPause.classList.remove('active');
            const hint = document.getElementById('audio-hint');
            if (hint) hint.classList.add('hidden');
            removeInteractionListeners();
        }).catch(err => console.log('Bloqueado por el navegador'));
    });

    btnPause.addEventListener('click', () => {
        bgAudio.pause();
        btnPause.classList.add('active');
        btnPlay.classList.remove('active');
    });

    // Enlazar directamente el primer scrolling u otra interaccion al click del boton
    const autoClickPlay = () => {
        if (bgAudio.paused) {
            btnPlay.click();
        }
        removeInteractionListeners();
    };

    const removeInteractionListeners = () => {
        window.removeEventListener('scroll', autoClickPlay);
        document.removeEventListener('click', autoClickPlay);
        document.removeEventListener('touchstart', autoClickPlay);
    };

    // Usar window para mayor efectividad en eventos de scroll
    window.addEventListener('scroll', autoClickPlay, { once: true });

    // Dejar un par adicionales por seguridad en dispositivos sin rueda de scroll tradicional
    document.addEventListener('click', autoClickPlay, { once: true });
    document.addEventListener('touchstart', autoClickPlay, { once: true });
}

// --- 6. RSVP FORM LOGIC ---
const rsvpForm = document.getElementById('rsvp-form');
if (rsvpForm) {
    rsvpForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitBtn = rsvpForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;

        // Show loading visual feedback
        submitBtn.disabled = true;
        submitBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Enviando...";

        const savedPin = localStorage.getItem('sofi_invite_pin') || '';
        const guestName = document.getElementById('guest-name').value.trim();
        const guestLimit = document.getElementById('guest-limit').value;
        const guestAttendance = document.getElementById('guest-attendance').value;
        const guestConfirm = document.getElementById('guest-confirm').value;

        // Si elige "no", los acompañantes confirmados son 0
        const confirmedCount = guestAttendance === 'no' ? 0 : parseInt(guestConfirm || 0);

        try {
            // Enviar a Google Sheets usando Content-Type text/plain para evitar preflight
            const response = await fetch(CONFIG.googleSheetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify({
                    action: 'rsvp',
                    pin: savedPin,
                    guestName: guestName,
                    'guest-confirm': confirmedCount
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                // Ocultar formulario y mostrar mensaje de éxito
                rsvpForm.style.display = 'none';
                const successMsg = document.getElementById('rsvp-success');
                if (successMsg) {
                    successMsg.classList.remove('hidden-message');
                    // Personalizar el mensaje según si asiste o no
                    const successH3 = successMsg.querySelector('h3');
                    const successP = successMsg.querySelector('p');
                    
                    if (guestAttendance === 'no') {
                        if (successH3) successH3.innerText = "¡Gracias por avisarnos!";
                        if (successP) successP.innerText = "Lamentamos mucho que no puedas acompañarnos. ¡Te extrañaremos! 💕";
                    } else {
                        if (successH3) successH3.innerText = "¡Gracias por confirmar! 🎉";
                        if (successP) successP.innerText = `Tu asistencia ha quedado registrada con ${confirmedCount} acompañante(s). ¡Nos vemos en la fiesta!`;
                    }
                }

                // Crear mensaje de confirmación de WhatsApp
                let message = "";
                if (guestAttendance === 'no') {
                    message = `¡Hola Sofi! Lamentablemente no podré asistir a tu fiesta de XV años. 🌸\n\n*Nombre:* ${guestName}\n*Mensaje:* ¡Te deseo que pases un día increíble y lleno de alegría!`;
                } else {
                    message = `¡Hola Sofi! Confirmo mi asistencia a tu fiesta de XV años. 🌸\n\n*Nombre:* ${guestName}\n*Acompañantes adicionales confirmados:* ${confirmedCount}`;
                }
                const whatsappUrl = `https://api.whatsapp.com/send?phone=${CONFIG.whatsappPhone}&text=${encodeURIComponent(message)}`;

                // Abrir WhatsApp en pestaña nueva tras 1.5s
                setTimeout(() => {
                    window.open(whatsappUrl, '_blank');
                }, 1500);
            } else {
                alert(result.message || 'Hubo un problema al registrar tu asistencia. Por favor inténtalo de nuevo.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        } catch (error) {
            console.error('Error al enviar los datos:', error);
            // Fallback: Redirigir directamente a WhatsApp en caso de error de red
            rsvpForm.style.display = 'none';
            const successMsg = document.getElementById('rsvp-success');
            if (successMsg) {
                successMsg.classList.remove('hidden-message');
            }
            
            let message = "";
            if (guestAttendance === 'no') {
                message = `¡Hola Sofi! Lamentablemente no podré asistir a tu fiesta de XV años. 🌸\n\n*Nombre:* ${guestName}\n*Mensaje:* ¡Te deseo que pases un día increíble y lleno de alegría!`;
            } else {
                message = `¡Hola Sofi! Confirmo mi asistencia a tu fiesta de XV años. 🌸\n\n*Nombre:* ${guestName}\n*Acompañantes adicionales confirmados:* ${confirmedCount}`;
            }
            const whatsappUrl = `https://api.whatsapp.com/send?phone=${CONFIG.whatsappPhone}&text=${encodeURIComponent(message)}`;

            setTimeout(() => {
                window.open(whatsappUrl, '_blank');
            }, 1500);
        }
    });
}
