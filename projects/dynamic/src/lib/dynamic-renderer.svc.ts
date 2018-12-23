import {
  Injectable,
  Injector,
  ElementRef,
  ComponentFactoryResolver,
  ComponentFactory,
  ComponentRef,
  ViewContainerRef,
  NgModule,
  Compiler,
  Component,
  InjectionToken,
  Type,
  ReflectiveInjector,
  ErrorHandler,
  NgModuleRef
} from "@angular/core";
import {
  NgxDynamicOptions,
  INgxDynamicRef,
  OnMount,
  IDynamicComponent,
  DynamicComponentConfiguration
} from "./dynamic-options";
import { Observable, Observer, forkJoin } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { InterpolationService } from "./interpolation.service";
import { isArray } from "util";

export function isBrowserPlatform() {
  return window != null && window.document != null;
}

@Injectable()
export class NgxDynamicRendererService {
  //	Fieldsa
  protected componentModules = new Map<string, NgModuleRef<{}>>();

  protected componentFactories = new Map<string, ComponentFactory<any>>();

  protected componentRefs = new Map<any, Array<ComponentRef<any>>>();

  protected factoriesCache: ComponentFactory<any>[];

  protected factoriesLoading: boolean;

  protected modulesSetup: boolean;

  //	Properties

  //	Constructors
  constructor(
    public options: NgxDynamicOptions,
    protected cfr: ComponentFactoryResolver,
    protected injector: Injector,
    protected interpolateSvc: InterpolationService,
    protected compiler: Compiler
  ) {
    this.options.Components.forEach(({ Selector, Component }) => {
      try {
        var cf = this.cfr.resolveComponentFactory(Component);

        this.componentFactories.set(Selector, cf);

        this.componentModules.set(Selector, null);
      } catch (err) {}
    });

    if (this.options.Modules && this.options.Modules.length > 0) {
      this.options.Modules.forEach(module => {
        this.compiler
          .compileModuleAndAllComponentsAsync(module)
          .then(moduleWithFactories => {
            var moduleRef = moduleWithFactories.ngModuleFactory.create(
              this.injector
            );

            moduleWithFactories.componentFactories.forEach(cf => {
              this.options.Components.push({
                Selector: cf.selector,
                Component: cf.componentType
              });

              this.componentFactories.set(cf.selector, cf);

              this.componentModules.set(cf.selector, moduleRef);
            });

            this.modulesSetup = true;
          });
      });
    } else this.modulesSetup = true;
  }

  //	API Methods
  public CompileTemplates(
    dyns: DynamicComponentConfiguration[],
    vcRef: ViewContainerRef
  ) {
    return new Promise(resolve => {
      this.CreateComponentFactories(dyns).then(
        (factories: ComponentFactory<IDynamicComponent>[]) => {
          var compRefs = factories.map(factory =>
            vcRef.createComponent(factory)
          );

          resolve(compRefs);
        }
      );
    });
  }

  public CreateComponentFactories(
    dyns: DynamicComponentConfiguration[]
  ): Promise<ComponentFactory<IDynamicComponent>[]> {
    //var dynsToLoad = dyns.filter(d => !this.componentFactories.has(`${d.Selector}|${d.Template}`))

    //if (!dynsToLoad) {
    //	return new Promise(resolve => {
    //		var factories = [];

    //		this.componentFactories.forEach(cf => factories.push(cf));

    //		resolve(factories);
    //	});
    //}else if (this.factoriesLoading) {
    //	return new Promise(resolve => {
    //		setTimeout(() => {
    //			this.CreateComponentFactories(dyns).then((factories: ComponentFactory<IDynamicComponent>[]) => {
    //				resolve(factories);
    //			});
    //		}, 5);
    //	});
    //} else {
    this.factoriesLoading = true;
    //}

    // var components = dyns.map(dyn => {
    //   const component = this.createDynamicComponent(
    //     dyn.Selector,
    //     dyn.Template,
    //     dyn.Host,
    //     dyn.Services
    //   );

    //   var compileContext = {
    //     Data: dyn.Data
    //   };

    //   //component.prototype['___template'] = dyn.Template;

    //   this.updateCompileProperties(component.prototype, compileContext);

    //   component.prototype.EvaluateCustomCode(dyn.Exports);

    //   return component;
    // });

    // const module = this.createDynamicModule(components);

    return new Promise(resolve => {
      // this.compiler
      // 	.compileModuleAndAllComponentsAsync(module)
      // 	.then((moduleWithFactories) => {
      // 		var factories = components.map(component => {
      // 			var factory = moduleWithFactories.componentFactories.find(x => x.componentType === component);
      // 			//this.componentFactories.set(`${factory.selector}|${component.prototype['___template']}`, factory);
      // 			return factory;
      // 		});
      // 		this.factoriesCache = factories;
      // 		//var cfFactories = [];
      // 		//this.componentFactories.forEach(cf => cfFactories.push(cf));
      // 		this.factoriesLoading = false;
      // resolve(factories);
      // 	});
      resolve(null);
    });
  }

  public RenderInnerHTML(
    elementRef: ElementRef,
    html: string,
    data: any
  ): INgxDynamicRef {
    if (!isBrowserPlatform())
      return {
        Check: () => {},
        Destroy: () => {}
      };

    elementRef.nativeElement.innerHTML = html;

    const componentRefs: Array<ComponentRef<any>> = [];

    this.renderWithModules(elementRef, html, data, () => {
      this.options.Components.forEach(({ Selector }) => {
        const elements = (elementRef.nativeElement as Element).querySelectorAll(
          Selector
        );

        Array.prototype.forEach.call(elements, (el: Element) => {
          const content = el.innerHTML;

          const cmpRef = this.componentFactories
            .get(Selector)
            .create(this.injector, [], el, this.componentModules.get(Selector));

          el.removeAttribute("ng-version");

          if (cmpRef.instance.dynamicOnMount) {
            const attrsMap = new Map<string, string>();

            if (el.hasAttributes()) {
              Array.prototype.forEach.call(el.attributes, (attr: Attr) => {
                attrsMap.set(attr.name, attr.value);
              });
            }
            (cmpRef.instance as OnMount).dynamicOnMount(attrsMap, content, el);
          }

          componentRefs.push(cmpRef);
        });
      });

      this.componentRefs.set(elementRef, componentRefs);
    });

    return {
      Check: () =>
        componentRefs.forEach(ref => ref.changeDetectorRef.detectChanges()),
      Destroy: () => {
        componentRefs.forEach(ref => ref.destroy());

        this.componentRefs.delete(elementRef);
      }
    };
  }

  public SetCompiler(compiler: Compiler) {
    this.compiler = compiler;
  }

  //	Helpers
  // protected createDynamicComponent(selector: string, template: string, host: { [key: string]: string },
  // 	compSvcs: { [key: string]: Type<any> | InjectionToken<any> }) {
  // 	@NgxComponent({
  // 		selector: selector,
  // 		template: template,
  // 		host: host,
  // 	})
  // 	class CompiledDynamicComponent implements IDynamicComponent {
  // 		//  Fields
  // 		protected get _(): any {
  // 			return this;
  // 		}

  // 		protected configSvc: SingletonService;

  // 		protected domainSvc: DomainService;

  // 		protected http: Http;

  // 		protected idSvc: IdentityService;

  // 		protected uiSvc: UIService;

  // 		//  Properties
  // 		public Data: any;

  // 		//	Constructors
  // 		constructor() {
  // 			//const injector =
  // 			//	ReflectiveInjector.resolveAndCreate([
  // 			//		{ provide: CODE_SERVICE_DOMAIN_SERVICE, useValue: DomainService },
  // 			//		{ provide: CODE_SERVICE_SINGLETON_SERVICE, useValue: SingletonService },
  // 			//		{ provide: CODE_SERVICE_UI_SERVICE, useValue: UIService },
  // 			//	])

  // 			//if (compSvcs)
  // 			//	for (var csKey in compSvcs) {
  // 			//		this[csKey] = injector.get(compSvcs[csKey]);
  // 			//	};
  // 		}

  // 		//	API Methods
  // 		public EvaluateCustomCode(exports: string) {
  // 			try {
  // 				if (exports)
  // 					eval(exports);
  // 			} catch (err) {
  // 				console.log(err);
  // 			}

  // 		}

  // 		//  Helpers
  // 		protected extractData<TData>(res: Response) {
  // 			let body = res.json();

  // 			if (!body)
  // 				return null;

  // 			return body as TData;
  // 		}

  // 		protected map<TData>() {
  // 			return map<any, TData>((res: Response) => this.extractData<TData>(res));
  // 		}

  // 		protected handleError(error: any): any {
  // 			// In a real world app, we might use a remote logging infrastructure
  // 			// We'd also dig deeper into the error to get a better message
  // 			let errMsg = (error.message) ? error.message :
  // 				error.status ? `${error.status} - ${error.statusText}` : 'Server error';

  // 			console.error(errMsg); // log to console instead

  // 			return Observable.throw(errMsg);
  // 		}

  // 		protected catchError() {
  // 			return catchError<any, any>(this.handleError);
  // 		}

  // 		protected loadScript(src: string) {
  // 			let node = <HTMLScriptElement>document.getElementById(src);

  // 			if (!node) {
  // 				node = document.createElement('script');

  // 				node.src = node.id = src;

  // 				node.type = 'text/javascript';

  // 				node.charset = 'utf-8';

  // 				document.getElementsByTagName('head')[0].appendChild(node);
  // 			}
  // 		}

  // 		protected loadStyle(src: string) {
  // 			let node = <HTMLLinkElement>document.getElementById(src);

  // 			if (!node) {
  // 				node = document.createElement('link');

  // 				node.href = node.id = src;

  // 				node.type = 'text/css';

  // 				node.rel = 'stylesheet';

  // 				node.charset = 'utf-8';

  // 				document.getElementsByTagName('head')[0].appendChild(node);
  // 			}
  // 		}

  // 		protected loadWait(waitCheck: Function, action: Function, checkInterval: number = 250) {
  // 			var check = waitCheck();

  // 			if (!check)
  // 				setTimeout(() => {
  // 					this.loadWait(waitCheck, action, checkInterval);
  // 				}, checkInterval);
  // 			else
  // 				action(check);
  // 		}
  // 	};

  // 	return CompiledDynamicComponent;
  // }

  // protected createDynamicModule(components: any[]) {
  // 	var declarations = this.loadModuleDeclarations(components);

  // 	var imports = [];

  // 	this.options.Modules.forEach(module => {
  // 		imports.push(module);
  // 	});

  // 	@NgxNgModule({
  // 		imports: imports,
  // 		declarations: declarations,
  // 	})
  // 	class DynamicModule {
  // 	}

  // 	return DynamicModule;
  // }

  protected loadModuleDeclarations(components: any[]) {
    var declarations = [...components];

    if (this.options.Components)
      this.options.Components.forEach(c => declarations.push(c.Component));

    return declarations;
  }

  protected processModulesForComponents(modules: any[]) {
    if (modules) {
      modules.forEach(module => {
        this.recursiveModuleForComponents(module);
      });
    }
  }

  protected processDeclarationsForComponents(declarations: any[]) {
    if (declarations) {
      declarations.forEach(dec => {
        if (isArray(dec)) this.processDeclarationsForComponents(dec);
        else {
          try {
            var cf = this.cfr.resolveComponentFactory(dec);

            this.componentFactories.set(cf.selector, cf);
          } catch (err) {
            console.log(err);
          }
        }
      });
    }
  }

  protected recursiveModuleForComponents(module: any) {
    if (module) {
      if (module.ngInjectorDef) {
        //	TODO:  Ever need to process declartions off of here?
        this.processModulesForComponents(module.ngInjectorDef.imports);
      } else if (
        module.decorators &&
        module.decorators[0] &&
        module.decorators[0].args
      ) {
        var setup = module.decorators[0].args[0];

        if (setup.imports) this.processModulesForComponents(setup.imports);

        if (setup.entryComponents)
          this.processDeclarationsForComponents(setup.entryComponents);

        if (setup.declarations)
          this.processDeclarationsForComponents(setup.declarations);
      }
    }
  }

  protected renderWithModules(
    elementRef: ElementRef,
    html: string,
    data: any,
    action: Function
  ) {
    if (this.modulesSetup) {
      action();
    } else {
      setTimeout(() => {
        this.renderWithModules(elementRef, html, data, action);
      }, 50);
    }
  }

  protected updateCompileProperties(compRefInstance: any, compileContext: any) {
    // compRefInstance['configSvc'] = this.configSvc;

    // compRefInstance['domainSvc'] = this.domainSvc;

    // compRefInstance['http'] = this.http;

    // compRefInstance['idSvc'] = this.idSvc;

    compRefInstance["injector"] = this.injector;

    for (var prop in compileContext) {
      try {
        compRefInstance[prop] = compileContext[prop];
      } catch (err) {}
    }
  }
}
