// Populate the sidebar
//
// This is a script, and not included directly in the page, to control the total size of the book.
// The TOC contains an entry for each page, so if each page includes a copy of the TOC,
// the total size of the page becomes O(n**2).
class MDBookSidebarScrollbox extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.innerHTML = '<ol class="chapter"><li class="chapter-item expanded "><div><strong aria-hidden="true">1.</strong> 基础</div></li><li><ol class="section"><li class="chapter-item expanded "><a href="base/1.new_project.html"><strong aria-hidden="true">1.1.</strong> 新项目</a></li><li class="chapter-item expanded "><a href="base/2.variable.html"><strong aria-hidden="true">1.2.</strong> 变量</a></li><li class="chapter-item expanded "><a href="base/3.loop.html"><strong aria-hidden="true">1.3.</strong> 循环</a></li><li class="chapter-item expanded "><a href="base/4.data_types.html"><strong aria-hidden="true">1.4.</strong> 数据类型</a></li><li class="chapter-item expanded "><a href="base/5.function.html"><strong aria-hidden="true">1.5.</strong> 函数</a></li><li class="chapter-item expanded "><a href="base/6.ownership.html"><strong aria-hidden="true">1.6.</strong> 所有权</a></li><li class="chapter-item expanded "><a href="base/7.reference.html"><strong aria-hidden="true">1.7.</strong> 引用与借用</a></li><li class="chapter-item expanded "><a href="base/8.compound_type.html"><strong aria-hidden="true">1.8.</strong> 复合类型</a></li><li class="chapter-item expanded "><a href="base/9.flow_control.html"><strong aria-hidden="true">1.9.</strong> 流程控制</a></li><li class="chapter-item expanded "><a href="base/10.match_pattern.html"><strong aria-hidden="true">1.10.</strong> 模式匹配</a></li><li class="chapter-item expanded "><a href="base/11.method.html"><strong aria-hidden="true">1.11.</strong> 方法</a></li><li class="chapter-item expanded "><a href="base/12.generic_trait.html"><strong aria-hidden="true">1.12.</strong> 泛型和特征</a></li></ol></li></ol>';
        // Set the current, active page, and reveal it if it's hidden
        let current_page = document.location.href.toString().split("#")[0];
        if (current_page.endsWith("/")) {
            current_page += "index.html";
        }
        var links = Array.prototype.slice.call(this.querySelectorAll("a"));
        var l = links.length;
        for (var i = 0; i < l; ++i) {
            var link = links[i];
            var href = link.getAttribute("href");
            if (href && !href.startsWith("#") && !/^(?:[a-z+]+:)?\/\//.test(href)) {
                link.href = path_to_root + href;
            }
            // The "index" page is supposed to alias the first chapter in the book.
            if (link.href === current_page || (i === 0 && path_to_root === "" && current_page.endsWith("/index.html"))) {
                link.classList.add("active");
                var parent = link.parentElement;
                if (parent && parent.classList.contains("chapter-item")) {
                    parent.classList.add("expanded");
                }
                while (parent) {
                    if (parent.tagName === "LI" && parent.previousElementSibling) {
                        if (parent.previousElementSibling.classList.contains("chapter-item")) {
                            parent.previousElementSibling.classList.add("expanded");
                        }
                    }
                    parent = parent.parentElement;
                }
            }
        }
        // Track and set sidebar scroll position
        this.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                sessionStorage.setItem('sidebar-scroll', this.scrollTop);
            }
        }, { passive: true });
        var sidebarScrollTop = sessionStorage.getItem('sidebar-scroll');
        sessionStorage.removeItem('sidebar-scroll');
        if (sidebarScrollTop) {
            // preserve sidebar scroll position when navigating via links within sidebar
            this.scrollTop = sidebarScrollTop;
        } else {
            // scroll sidebar to current active section when navigating via "next/previous chapter" buttons
            var activeSection = document.querySelector('#sidebar .active');
            if (activeSection) {
                activeSection.scrollIntoView({ block: 'center' });
            }
        }
        // Toggle buttons
        var sidebarAnchorToggles = document.querySelectorAll('#sidebar a.toggle');
        function toggleSection(ev) {
            ev.currentTarget.parentElement.classList.toggle('expanded');
        }
        Array.from(sidebarAnchorToggles).forEach(function (el) {
            el.addEventListener('click', toggleSection);
        });
    }
}
window.customElements.define("mdbook-sidebar-scrollbox", MDBookSidebarScrollbox);
