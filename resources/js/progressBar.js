class ProgressBar {
    /**
    * Creates a new progress bar
    * @param {object} options - Configuration options
    * @param {string} [options.id] - Element ID (auto-generated if not provided)
    * @param {string} [options.containerId] - ID of the container where the bar will be inserted
    * @param {number} [options.min=0] - Minimum value
    * @param {number} [options.max=100] - Maximum value
    * @param {number} [options.current=0] - Current value
    * @param {string} [options.color='#4CAF50'] - Bar color
    * @param {string} [options.label=''] - Bar label (e.g., "HP", "MP")
    * @param {string} [options.textTemplate] - Text template (overrides label if provided)
    * @param {string} [options.containerClass='progress-bar-container'] - Container class
    * @param {string} [options.barClass='progress-bar'] - Bar class
    * @param {boolean} [options.showText=true] - Whether to show center text
    * @param {boolean} [options.enableLowEffect=true] - Whether to show the low effect when the current value is at 30% or less
    */
    constructor(options = {}) {
        this.config = {
            min: 0,
            max: 100,
            current: 0,
            color: '#4CAF50',
            label: '',
            containerClass: 'progress-bar-container',
            barClass: 'progress-bar',
            showText: true,
            enableLowEffect: true,
            ...options
        };
        this.config.min = Math.round(this.config.min);
        this.config.max = Math.round(this.config.max);
        this.config.current = Math.round(this.config.current);
        this.id = options.id || `progress-bar-${new Date()}`;
        this.createHTML();
        this.barElement = document.getElementById(this.id);
        this.fillElement = this.barElement.querySelector('.progress-bar-fill');
        this.textElement = this.barElement.querySelector('.progress-bar-text');
        this.update();
    }

    createHTML() {
        const container = document.createElement('div');
        container.className = this.config.containerClass;
        const bar = document.createElement('div');
        bar.className = this.config.barClass;
        bar.id = this.id;
        const fill = document.createElement('div');
        fill.className = 'progress-bar-fill';
        const text = document.createElement('div');
        text.className = 'progress-bar-text';
        bar.appendChild(fill);
        if (this.config.showText) {
            bar.appendChild(text);
        }
        container.appendChild(bar);
        if (this.config.containerId) {
            const parent = document.getElementById(this.config.containerId);
            if (parent) {
                parent.innerHTML = '';
                parent.appendChild(container);
                return;
            }
        }
        console.warn(`Container with ID ${this.config.containerId} not found, appending to body`);
        document.body.appendChild(container);
    }

    update() {
        this.config.current = Math.floor(Math.max(this.config.min, Math.min(this.config.max, this.config.current)));
        const percentage = ((this.config.current - this.config.min) / (this.config.max - this.config.min)) * 100;
        if (this.fillElement) {
            this.fillElement.style.width = `${percentage}%`;
            if (this.config.enableLowEffect && percentage < 30) {
                this.fillElement.classList.add('low');
            } else {
                this.fillElement.classList.remove('low');
                this.fillElement.style.backgroundColor = this.config.color;
            }
        }
        if (this.textElement && this.config.showText) {
            this.textElement.textContent = this.config.textTemplate 
                ? this.config.textTemplate(this.config.min, this.config.current, this.config.max)
                : `${this.config.label}: ${this.config.current}/${this.config.max}`;
        }
    }

    setMin(min) {
        this.config.min = min;
        this.update();
    }

    setMax(max) {
        this.config.max = max;
        this.update();
    }

    setCurrent(current) {
        this.config.current = current;
        this.update();
    }

    setColor(color) {
        this.config.color = color;
        this.update();
    }

    setLabel(label) {
        this.config.label = label;
        this.update();
    }

    setTextTemplate(template) {
        this.config.textTemplate = template;
        this.update();
    }

    setShowText(show) {
        this.config.showText = show;
        if (this.textElement) {
            this.textElement.style.display = show ? 'block' : 'none';
        }
        this.update();
    }

    destroy() {
        if (this.barElement && this.barElement.parentNode) {
            this.barElement.parentNode.remove();
        }
    }
}

export default ProgressBar;