import { H } from "fest/lure";
import { SliderInput } from "fest/fl-ui";

async function createSliderTest() {
    const { H } = await import("fest/lure");
    const { SliderInput } = await import("fest/fl-ui");

    return H`
        <div class="c2-surface" style="padding: 2rem; margin: 1rem; border-radius: 1rem; max-width: 800px;">
            <h1 style="margin-bottom: 2rem; color: var(--c2-contrast);">🎚️ Slider Component Test</h1>

            <div style="display: grid; gap: 2rem;">
                <!-- Range Sliders -->
                <section>
                    <h2 style="margin-bottom: 1rem; color: var(--c2-contrast);">📊 Range Sliders</h2>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <div style="padding: 1rem; background: var(--c2-surface); border-radius: 0.5rem;">
                            <h3>Volume Control</h3>
                            <p>Min: 0, Max: 100, Step: 1</p>
                            <ui-slider variant="slider" style="width: 100%; margin: 1rem 0;">
                                <input type="range" min="0" max="100" step="1" value="75" name="volume">
                            </ui-slider>
                            <div class="value-display" style="font-family: monospace; color: var(--c2-contrast);">Value: 75</div>
                        </div>

                        <div style="padding: 1rem; background: var(--c2-surface); border-radius: 0.5rem;">
                            <h3>Temperature Range</h3>
                            <p>Min: -10, Max: 40, Step: 0.5</p>
                            <ui-slider variant="slider" style="width: 100%; margin: 1rem 0;">
                                <input type="range" min="-10" max="40" step="0.5" value="20" name="temperature">
                            </ui-slider>
                            <div class="value-display" style="font-family: monospace; color: var(--c2-contrast);">Value: 20</div>
                        </div>
                    </div>
                </section>

                <!-- Switch Controls -->
                <section>
                    <h2 style="margin-bottom: 1rem; color: var(--c2-contrast);">🔘 Switch Controls</h2>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <div style="padding: 1rem; background: var(--c2-surface); border-radius: 0.5rem;">
                            <h3>Power Toggle</h3>
                            <p>On/Off switch</p>
                            <ui-slider variant="switch" style="width: 64px; height: 32px; margin: 1rem 0;">
                                <input type="checkbox" name="power">
                            </ui-slider>
                            <div class="value-display" style="font-family: monospace; color: var(--c2-contrast);">Value: false</div>
                        </div>

                        <div style="padding: 1rem; background: var(--c2-surface); border-radius: 0.5rem;">
                            <h3>Notification Settings</h3>
                            <p>Enable notifications</p>
                            <ui-slider variant="switch" style="width: 64px; height: 32px; margin: 1rem 0;">
                                <input type="checkbox" checked name="notifications">
                            </ui-slider>
                            <div class="value-display" style="font-family: monospace; color: var(--c2-contrast);">Value: true</div>
                        </div>
                    </div>
                </section>

                <!-- Number Inputs -->
                <section>
                    <h2 style="margin-bottom: 1rem; color: var(--c2-contrast);">🔢 Number Inputs</h2>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <div style="padding: 1rem; background: var(--c2-surface); border-radius: 0.5rem;">
                            <h3>Quantity Selector</h3>
                            <p>Min: 1, Max: 50, Step: 1</p>
                            <ui-slider variant="slider" style="width: 100%; margin: 1rem 0;">
                                <input type="number" min="1" max="50" step="1" value="10" name="quantity">
                            </ui-slider>
                            <div class="value-display" style="font-family: monospace; color: var(--c2-contrast);">Value: 10</div>
                        </div>

                        <div style="padding: 1rem; background: var(--c2-surface); border-radius: 0.5rem;">
                            <h3>Precision Control</h3>
                            <p>Min: 0, Max: 10, Step: 0.1</p>
                            <ui-slider variant="slider" style="width: 100%; margin: 1rem 0;">
                                <input type="number" min="0" max="10" step="0.1" value="5.5" name="precision">
                            </ui-slider>
                            <div class="value-display" style="font-family: monospace; color: var(--c2-contrast);">Value: 5.5</div>
                        </div>
                    </div>
                </section>

                <!-- Form Integration Test -->
                <section>
                    <h2 style="margin-bottom: 1rem; color: var(--c2-contrast);">📝 Form Integration Test</h2>
                    <div style="padding: 1rem; background: var(--c2-surface); border-radius: 0.5rem;">
                        <form id="settingsForm">
                            <div style="display: flex; flex-direction: column; gap: 1rem;">
                                <label style="display: flex; align-items: center; gap: 1rem;">
                                    <span>Brightness:</span>
                                    <ui-slider variant="slider" style="flex: 1;">
                                        <input type="range" min="0" max="100" value="80" name="brightness">
                                    </ui-slider>
                                </label>

                                <label style="display: flex; align-items: center; gap: 1rem;">
                                    <span>Dark Mode:</span>
                                    <ui-slider variant="switch" style="width: 64px; height: 32px;">
                                        <input type="checkbox" name="darkMode">
                                    </ui-slider>
                                </label>

                                <label style="display: flex; align-items: center; gap: 1rem;">
                                    <span>Font Size:</span>
                                    <ui-slider variant="slider" style="flex: 1;">
                                        <input type="number" min="12" max="24" step="1" value="16" name="fontSize">
                                    </ui-slider>
                                </label>
                            </div>

                            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                                <button type="submit" style="padding: 0.5rem 1rem; background: var(--c2-contrast); color: var(--c2-surface); border: none; border-radius: 0.25rem; cursor: pointer;">Save Settings</button>
                                <button type="button" onclick="showFormData()" style="padding: 0.5rem 1rem; background: var(--c2-surface); color: var(--c2-contrast); border: 1px solid var(--c2-contrast); border-radius: 0.25rem; cursor: pointer;">Show Form Data</button>
                                <button type="button" onclick="resetForm()" style="padding: 0.5rem 1rem; background: var(--c2-surface); color: var(--c2-contrast); border: 1px solid var(--c2-contrast); border-radius: 0.25rem; cursor: pointer;">Reset</button>
                            </div>
                        </form>
                    </div>
                </section>

                <!-- Disabled State -->
                <section>
                    <h2 style="margin-bottom: 1rem; color: var(--c2-contrast);">🚫 Disabled State</h2>
                    <div style="padding: 1rem; background: var(--c2-surface); border-radius: 0.5rem;">
                        <h3>Read-Only Control</h3>
                        <p>Disabled slider (non-interactive)</p>
                        <ui-slider variant="slider" style="width: 100%; margin: 1rem 0;" disabled>
                            <input type="range" min="0" max="100" value="60" name="disabled" disabled>
                        </ui-slider>
                        <div class="value-display" style="font-family: monospace; color: var(--c2-contrast);">Value: 60 (disabled)</div>
                    </div>
                </section>
            </div>
        </div>
    `;
}

async function main() {
    const { default: loadCSS } = await import("fest/dom");
    await loadCSS();

    const container = document.querySelector("#app") || document.body;
    const sliderTest = await createSliderTest();

    container.appendChild(sliderTest);

    // Setup event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Listen for changes on all sliders
    document.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (target && target.tagName === 'INPUT' && target.closest('ui-slider')) {
            const slider = target.closest('ui-slider');
            const valueDisplay = slider?.querySelector('.value-display');
            if (valueDisplay) {
                valueDisplay.textContent = `Value: ${target.value}`;
            }
            console.log(`Slider "${target.name}" changed to:`, target.value);
        }
    });

    // Handle form submission
    const form = document.getElementById('settingsForm') as HTMLFormElement;
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            console.log('Form submitted with data:', Object.fromEntries(formData));
            alert('Settings saved! Check console for form data.');
        });
    }

    // Setup global functions for buttons
    (window as any).showFormData = function() {
        const form = document.getElementById('settingsForm') as HTMLFormElement;
        if (form) {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            console.log('Current form data:', data);
            alert(`Form Data:\n${JSON.stringify(data, null, 2)}`);
        }
    };

    (window as any).resetForm = function() {
        const form = document.getElementById('settingsForm') as HTMLFormElement;
        if (form) {
            form.reset();
            // Reset value displays
            document.querySelectorAll('.value-display').forEach(display => {
                const input = display.closest('ui-slider')?.querySelector('input') as HTMLInputElement;
                if (input) {
                    display.textContent = `Value: ${input.value}`;
                }
            });
        }
    };
}

main();
