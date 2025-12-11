// JavaScript для работы с отзывами
document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const form = document.getElementById('testimonialForm');
    const authorNameInput = document.getElementById('authorName');
    const testimonialTextInput = document.getElementById('testimonialText');
    const ratingInput = document.getElementById('rating');
    const stars = document.querySelectorAll('.star');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');
    const testimonialsContainer = document.getElementById('testimonialsContainer');
    const notification = document.getElementById('notification');
    
    let selectedRating = 0;
    
    // ВАШИ 2 ОТЗЫВА ПО УМОЛЧАНИЮ
    const defaultTestimonials = [
        {
            id: 1,
            author: "Мария",
            text: "Заказывала у Вас автоматизированную систему для анализа рынка. Всем довольны) Если надумаете прийти к нам на полную ставку, очень ждём!",
            rating: 5,
            date: new Date('2025-01-12').toISOString(),
            isDefault: true // МЕТКА, что это отзыв по умолчанию
        },
        {
            id: 2,
            author: "Константин",
            text: "Была моей подкураторной по разработке автоатизированной системы! Что сказать?.. Оочень ответсвенная, быстро учится и не бросает начатое на полпути. Молодец!",
            rating: 4,
            date: new Date('2024-01-10').toISOString(),
            isDefault: true // МЕТКА, что это отзыв по умолчанию
        }
    ];
    
    // Инициализация хранилища
    function initializeStorage() {
        const storedTestimonials = JSON.parse(localStorage.getItem('testimonials'));
        
        if (!storedTestimonials) {
            // Если в хранилище ничего нет, сохраняем ВАШИ отзывы по умолчанию
            localStorage.setItem('testimonials', JSON.stringify(defaultTestimonials));
        } else {
            // Проверяем, есть ли уже отзывы по умолчанию в хранилище
            const hasDefaultTestimonials = storedTestimonials.some(t => t.isDefault === true);
            
            if (!hasDefaultTestimonials) {
                // Добавляем ВАШИ отзывы по умолчанию к существующим
                const allTestimonials = [...storedTestimonials, ...defaultTestimonials];
                localStorage.setItem('testimonials', JSON.stringify(allTestimonials));
            }
        }
    }
    
    // Инициализация рейтинга
    stars.forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.dataset.rating);
            ratingInput.value = selectedRating;
            
            stars.forEach((s, index) => {
                if (index < selectedRating) {
                    s.classList.add('active');
                    s.textContent = '★';
                } else {
                    s.classList.remove('active');
                    s.textContent = '☆';
                }
            });
        });
        
        star.addEventListener('mouseover', function() {
            const hoverRating = parseInt(this.dataset.rating);
            stars.forEach((s, index) => {
                if (index < hoverRating) {
                    s.classList.add('active');
                    s.textContent = '★';
                }
            });
        });
        
        star.addEventListener('mouseout', function() {
            stars.forEach((s, index) => {
                if (index >= selectedRating) {
                    s.classList.remove('active');
                    s.textContent = '☆';
                }
            });
        });
    });
    
    // Загрузка всех отзывов (ВАШИ по умолчанию + пользовательские)
    function loadTestimonials() {
        const allTestimonials = JSON.parse(localStorage.getItem('testimonials')) || [];
        testimonialsContainer.innerHTML = '';
        
        if (allTestimonials.length === 0) {
            testimonialsContainer.innerHTML = `
                <div class="empty-testimonials">
                    <p>Пока нет отзывов. Будьте первым!</p>
                </div>
            `;
            return;
        }
        
        // Разделяем отзывы на пользовательские и ваши (по умолчанию)
        const userTestimonials = allTestimonials.filter(t => !t.isDefault);
        const yourTestimonials = allTestimonials.filter(t => t.isDefault);
        
        // Сортируем пользовательские отзывы по дате (новые первые)
        userTestimonials.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Собираем все для отображения: сначала пользовательские, потом ваши
        const displayTestimonials = [...userTestimonials, ...yourTestimonials];
        
        displayTestimonials.forEach(testimonial => {
            const testimonialElement = document.createElement('div');
            testimonialElement.className = 'testimonial-item';
            
            // Добавляем метку для ваших отзывов
            if (testimonial.isDefault) {
                testimonialElement.classList.add('your-testimonial');
            }
            
            // Создание строки рейтинга
            let starsHtml = '';
            if (testimonial.rating > 0) {
                for (let i = 1; i <= 5; i++) {
                    starsHtml += i <= testimonial.rating ? '★' : '☆';
                }
            }
            
           // СТАЛО (убираем "Мой отзыв" и разделитель):
testimonialElement.innerHTML = `
    <div class="testimonial-header">
        <div class="testimonial-author">${escapeHtml(testimonial.author)}</div>
        <div class="testimonial-date">${formatDate(testimonial.date)}</div>
    </div>
    ${testimonial.rating > 0 ? `<div class="testimonial-rating">${starsHtml}</div>` : ''}
    <div class="testimonial-text">${escapeHtml(testimonial.text)}</div>
`;

// УДАЛЯЕМ ВЕСЬ БЛОК с разделителем полностью
            
            testimonialsContainer.appendChild(testimonialElement);
        });
        
    
    }
    
    // Обработка отправки формы (добавление НОВОГО отзыва пользователя)
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const author = authorNameInput.value.trim();
        const text = testimonialTextInput.value.trim();
        const rating = parseInt(ratingInput.value) || 0;
        
        if (!author || !text) {
            showNotification('Пожалуйста, заполните все обязательные поля', 'error');
            return;
        }
        
        if (author.length < 2) {
            showNotification('Имя должно содержать минимум 2 символа', 'error');
            return;
        }
        
        if (text.length < 10) {
            showNotification('Отзыв должен содержать минимум 10 символов', 'error');
            return;
        }
        
        // Показать загрузку
        btnText.style.display = 'none';
        btnLoader.style.display = 'flex';
        submitBtn.disabled = true;
        
        // Имитация задержки сети
        setTimeout(() => {
            // Получаем ВСЕ отзывы
            const allTestimonials = JSON.parse(localStorage.getItem('testimonials')) || [];
            
            // Находим максимальный ID
            const maxId = allTestimonials.reduce((max, t) => Math.max(max, t.id), 0);
            
            // Создаем НОВЫЙ отзыв пользователя
            const newTestimonial = {
                id: maxId + 1,
                author: author,
                text: text,
                rating: rating,
                date: new Date().toISOString(),
                isDefault: false // ПОЛЬЗОВАТЕЛЬСКИЙ отзыв
            };
            
            // Добавляем НОВЫЙ отзыв в начало массива
            allTestimonials.unshift(newTestimonial);
            
            // Сохраняем обратно
            localStorage.setItem('testimonials', JSON.stringify(allTestimonials));
            
            // Очистка формы
            form.reset();
            ratingInput.value = 0;
            selectedRating = 0;
            
            // Сброс звезд
            stars.forEach(star => {
                star.classList.remove('active');
                star.textContent = '☆';
            });
            
            // Сброс лейблов формы
            const labels = form.querySelectorAll('.form-label');
            labels.forEach(label => {
                label.style.top = '1rem';
                label.style.left = '1rem';
                label.style.fontSize = '0.95rem';
                label.style.color = 'var(--gray)';
            });
            
            // Обновляем список
            loadTestimonials();
            
            // Показать уведомление
            showNotification('Отзыв успешно добавлен! ✨', 'success');
            
            // Скрыть загрузку
            btnText.style.display = 'inline-block';
            btnLoader.style.display = 'none';
            submitBtn.disabled = false;
            
            // Фокус на поле имени
            authorNameInput.focus();
            
        }, 1000);
    });
    
    // Функция показа уведомления
    function showNotification(message, type = 'success') {
        notification.textContent = message;
        notification.className = 'notification';
        
        if (type === 'error') {
            notification.style.background = '#dc2626';
            notification.style.color = 'white';
        } else {
            notification.style.background = 'var(--purple)';
            notification.style.color = 'white';
        }
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }
    
    // Функция форматирования даты
    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Сегодня';
        } else if (diffDays === 1) {
            return 'Вчера';
        } else if (diffDays < 7) {
            return `${diffDays} дня назад`;
        } else {
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        }
    }
    
    // Функция экранирования HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Инициализация при загрузке
    initializeStorage();
    loadTestimonials();
    
    // Фокус на поле имени
    authorNameInput.focus();
    
    // Анимация спиннера
    const spinner = btnLoader.querySelector('.spinner');
    if (spinner) {
        let rotation = 0;
        setInterval(() => {
            rotation += 10;
            spinner.style.transform = `rotate(${rotation}deg)`;
        }, 50);
    }
});
