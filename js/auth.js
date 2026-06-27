/**
 * Authentication handler for Mini Miles
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log("Auth script loaded");

    const addInputFeedback = () => {
        const inputs = document.querySelectorAll('.form-container input');
        inputs.forEach(input => {
            const updateInputState = () => {
                if (input.value) {
                    input.classList.add('has-value');
                } else {
                    input.classList.remove('has-value');
                }
            };
            
            input.addEventListener('focus', () => input.parentElement.classList.add('focused'));
            input.addEventListener('blur', () => input.parentElement.classList.remove('focused'));
            input.addEventListener('input', updateInputState);
            
            updateInputState();
        });
    };
    
    addInputFeedback();

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            const emailInput = loginForm.querySelector('input[name="email"]');
            if (emailInput) emailInput.value = rememberedEmail;
        }
    
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing In...';
            
            const errorElement = document.getElementById('login-error');
            const messageElement = document.getElementById('login-message');
            if (errorElement) errorElement.style.display = 'none';
            if (messageElement) messageElement.style.display = 'none';
            
            fetch('/minimiles/login.php', { method: 'POST', body: new FormData(loginForm) }) // Fixed path
                .then(response => handleJsonResponse(response))
                .then(data => {
                    if (data.success) {
                        sessionStorage.setItem('user', JSON.stringify(data.user));
                        if (messageElement) {
                            messageElement.textContent = "Login successful! Redirecting...";
                            messageElement.style.display = 'block';
                        }
                        
                        document.querySelector('.form-container').classList.add('success-animation');
                        
                        setTimeout(() => {
                            window.location.href = data.redirect || '/minimiles/index.html'; // Use redirect from server
                        }, 1500);
                    } else {
                        if (errorElement) {
                            errorElement.textContent = data.message || "Login failed";
                            errorElement.style.display = 'block';
                        }
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalBtnText;
                        
                        document.querySelector('.form-container').classList.add('error-shake');
                        setTimeout(() => {
                            document.querySelector('.form-container').classList.remove('error-shake');
                        }, 500);
                    }
                })
                .catch(error => {
                    console.error("Login error:", error);
                    if (errorElement) {
                        errorElement.textContent = error.message || "Authentication failed. Please try again or contact support.";
                        errorElement.style.display = 'block';
                    }
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                });
        });
    }
    
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        const passwordInput = document.getElementById('reg_password');
        const confirmInput = document.getElementById('confirm_password');
        
        if (confirmInput && passwordInput) {
            confirmInput.addEventListener('input', function() {
                if (this.value && passwordInput.value !== this.value) {
                    this.setCustomValidity("Passwords don't match");
                } else {
                    this.setCustomValidity('');
                }
            });
            
            passwordInput.addEventListener('input', function() {
                if (confirmInput.value && confirmInput.value !== this.value) {
                    confirmInput.setCustomValidity("Passwords don't match");
                } else {
                    confirmInput.setCustomValidity('');
                }
            });
        }
        
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating Account...';
            
            const errorElement = document.getElementById('register-error');
            const messageElement = document.getElementById('register-message');
            if (errorElement) errorElement.style.display = 'none';
            if (messageElement) messageElement.style.display = 'none';
            
            fetch('/minimiles/register.php', {
                method: 'POST',
                body: new FormData(registerForm),
                headers: { 'Accept': 'application/json' }
            })
            .then(response => handleJsonResponse(response))
            .then(data => {
                if (data.success) {
                    if (messageElement) {
                        messageElement.textContent = data.message || "Registration successful! Redirecting to login...";
                        messageElement.style.display = 'block';
                    }
                    
                    document.querySelector('.form-container').classList.add('success-animation');
                    
                    registerForm.reset();
                    setTimeout(() => {
                        window.location.href = '/minimiles/login.html';
                    }, 2000);
                } else {
                    if (errorElement) {
                        errorElement.textContent = data.message || "Registration failed";
                        errorElement.style.display = 'block';
                    }
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                    
                    document.querySelector('.form-container').classList.add('error-shake');
                    setTimeout(() => {
                        document.querySelector('.form-container').classList.remove('error-shake');
                    }, 400);
                }
            })
            .catch(error => {
                console.error("Registration error:", error);
                if (errorElement) {
                    errorElement.textContent = error.message || "Registration failed. Please try again or contact support.";
                    errorElement.style.display = 'block';
                }
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            });
        });
    }
    
    function handleJsonResponse(response) {
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
        }
        const contentType = response.headers.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
            return response.text().then(text => {
                console.error("Raw server response:", text);
                throw new Error('Server returned non-JSON response');
            });
        }
        return response.json();
    }
});