// for sidebar nav
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const navItems = document.querySelectorAll('.nav-item');
const closeBtn = document.getElementById('closeBtn');

// Setup tab loop from last nav-item to menuBtn
function setupTabLoop() {
    const lastNav = navItems[navItems.length - 1];
    lastNav.addEventListener("keydown", function (e) {
        const isSidebarOpen = sidebar.classList.contains('w-full') || sidebar.classList.contains('md:w-64');
        if (!isSidebarOpen) return;

        if (e.key === "Tab" && !e.shiftKey) {
            e.preventDefault();
            menuBtn.focus();
        }
    });
}

function openSidebar() {
    sidebar.classList.remove('w-0', 'md:w-0');
    sidebar.classList.add('w-full', 'md:w-64', 'border-r');
    sidebar.setAttribute('aria-hidden', 'false');
    sidebar.removeAttribute("inert");

    menuBtn.classList.remove('left-0');
    menuBtn.classList.add('left-full', 'md:left-64');

    closeBtn.classList.remove('opacity-0', 'pointer-events-none');

    navItems.forEach((item, index) => {
        setTimeout(() => {
            item.classList.remove('opacity-0', '-translate-x-5');
        }, index * 100);
    });
    
    enableNavFocus();
}

function closeSidebar() {
    sidebar.classList.remove('w-full', 'md:w-64', 'border-r');
    sidebar.classList.add('w-0', 'md:w-0');
    sidebar.setAttribute("inert", "");


    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.classList.remove('left-full', 'md:left-64');
    menuBtn.classList.add('left-0');

    closeBtn.classList.add('opacity-0', 'pointer-events-none');

    navItems.forEach(item => {
        item.classList.add('opacity-0', '-translate-x-5');
    });

    disableNavFocus();
}

document.addEventListener('keydown', (e) => {
    const isOpen = sidebar.classList.contains('w-full') || sidebar.classList.contains('md:w-64');
    if (e.key === 'Escape' && isOpen) {
        closeSidebar();
        menuBtn.focus();
    }
});

menuBtn.addEventListener('click', () => {
    const isOpen = sidebar.classList.contains('w-full') || sidebar.classList.contains('md:w-64');
    isOpen ? closeSidebar() : openSidebar();
});

closeBtn.addEventListener('click', closeSidebar);

// tab index focus
function disableNavFocus() {
    navItems.forEach(el => {
        el.setAttribute('tabindex', '-1');
        el.setAttribute('aria-hidden', 'true');
    });
}

function enableNavFocus() {
    navItems.forEach(el => {
        el.setAttribute('tabindex', '0');
        el.removeAttribute('aria-hidden');
    });
    setupTabLoop();
}

disableNavFocus();
