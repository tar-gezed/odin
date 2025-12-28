import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <router-outlet></router-outlet>
    <div class="view-transition-shield-helper"></div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: #000;
    }
  `]
})
export class AppComponent {
  constructor(private translate: TranslateService) {
    const browserLang = translate.getBrowserLang();
    translate.setDefaultLang('en');
    translate.use(browserLang?.match(/en|fr/) ? browserLang : 'en');

    // Initial calculation
    this.updateShieldRotation();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateShieldRotation();
  }

  private updateShieldRotation() {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Distance traveled is 200% of width (from -50% to 150%)
      const distance = width * 2;

      // Circumference of the shield (diameter is height of screen)
      const circumference = height * Math.PI;

      // Calculate rotations needed
      const rotations = distance / circumference;
      const degrees = rotations * 360;

      document.documentElement.style.setProperty('--shield-rotation', `${degrees}deg`);
    }
  }
}
