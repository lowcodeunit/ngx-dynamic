import { NgModule, ModuleWithProviders, ANALYZE_FOR_ENTRY_COMPONENTS } from '@angular/core';

import { MatButtonModule, MatCardModule, MatIconModule, MatListModule } from '@angular/material';

import { FathymSharedModule } from '@lcu/hosting';

import { NgxDynamicComponent } from './dynamic.component';
import { NgxDynamicOptions } from './dynamic-options';
import { NgxDynamicDirective } from './dynamic.directive';
import { NgxDisplayDirective } from './display.directive';
import { NgxDynamicRendererService } from './dynamic-renderer.svc';
import { InterpolationService } from './interpolation.service';
import { HtmlParser, Parser } from '@angular/compiler';
import { NgxCompiledDirective } from './compiled.directive';

@NgModule({
	imports: [
		FathymSharedModule,
	],
	declarations: [
		NgxCompiledDirective,
		NgxDynamicComponent,
		NgxDynamicDirective,
		NgxDisplayDirective,
	],
	exports: [
		NgxCompiledDirective,
		NgxDynamicComponent,
		NgxDynamicDirective,
		NgxDisplayDirective,
	],
	entryComponents: [
		NgxDynamicComponent,
	]
})
export class NgxDynamicModule {
	static forRoot(options: NgxDynamicOptions): ModuleWithProviders {
		return {
			ngModule: NgxDynamicModule,
			providers: [
				NgxDynamicRendererService,
				InterpolationService,
				{ provide: Parser, useClass: HtmlParser },
				{ provide: NgxDynamicOptions, useValue: options },
				{ provide: ANALYZE_FOR_ENTRY_COMPONENTS, useValue: options.Components, multi: true },
			],
		};
	}
}
