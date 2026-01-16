export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    // Base classes for all toasts - responsive
    const baseClasses = 'pointer-events-auto flex items-center gap-2 sm:gap-4 px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-full bg-slate-900/95 backdrop-blur-xl border shadow-2xl text-white text-sm sm:text-base font-medium min-w-0 sm:min-w-[300px] max-w-[calc(100vw-2rem)] justify-center relative overflow-hidden animate-toast-in';
    
    // Type-specific classes
    const typeClasses = {
        success: 'border-emerald-500/50',
        error: 'border-red-500/50'
    };
    
    toast.className = `${baseClasses} ${typeClasses[type] || typeClasses.success}`;

    // Create icon
    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined text-xl sm:text-2xl flex-shrink-0';
    if (type === 'success') {
        icon.textContent = 'check_circle';
        icon.classList.add('text-emerald-400');
    } else if (type === 'error') {
        icon.textContent = 'error';
        icon.classList.add('text-red-400');
    } else {
        icon.textContent = 'info';
        icon.classList.add('text-cyan-400');
    }
    toast.appendChild(icon);

    // Create message span
    const messageSpan = document.createElement('span');
    messageSpan.className = 'flex-1 text-center text-sm sm:text-lg truncate';
    messageSpan.textContent = message;
    toast.appendChild(messageSpan);

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'ml-2 sm:absolute sm:right-4 bg-transparent border-none text-slate-400 text-lg sm:text-xl cursor-pointer p-0 leading-none flex items-center justify-center hover:text-white transition-colors flex-shrink-0';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => toast.remove();
    toast.appendChild(closeBtn);

    container.appendChild(toast);

    // Auto remove after 4 seconds with fade out
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'scale(0.8) translateY(-20px)';
        toast.style.transition = 'all 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}