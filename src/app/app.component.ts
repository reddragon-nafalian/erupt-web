import {Component, ElementRef, OnInit, Renderer2} from '@angular/core';
import {NavigationEnd, NavigationError, RouteConfigLoadStart, Router} from '@angular/router';
import {TitleService, VERSION as VERSION_ALAIN} from '@delon/theme';
import {environment} from '@env/environment';
import {NzModalService} from 'ng-zorro-antd/modal';
import {VERSION as VERSION_ZORRO} from 'ng-zorro-antd/version';
import {WindowModel} from "@shared/model/window.model";

@Component({
    selector: 'app-root',
    template: `
        <router-outlet></router-outlet>
    `
})
export class AppComponent implements OnInit {
    constructor(
        el: ElementRef,
        renderer: Renderer2,
        private router: Router,
        private titleSrv: TitleService,
        private modalSrv: NzModalService
    ) {
        renderer.setAttribute(el.nativeElement, 'ng-alain-version', VERSION_ALAIN.full);
        renderer.setAttribute(el.nativeElement, 'ng-zorro-version', VERSION_ZORRO.full);
        renderer.setAttribute(el.nativeElement, 'ng-erupt-version', VERSION_ALAIN.full);
    }

    beforeMatch = null;

    ngOnInit(): void {
        let configLoad = false;
        this.router.events.subscribe(ev => {
            if (ev instanceof RouteConfigLoadStart) {
                configLoad = true;
            }
            if (configLoad && ev instanceof NavigationError) {
                this.modalSrv.confirm({
                    nzTitle: `提醒`,
                    nzContent: environment.production ? `应用可能已发布新版本，请点击刷新才能生效。` : `无法加载路由：${ev.url}`,
                    nzCancelDisabled: false,
                    nzOkText: '刷新',
                    nzCancelText: '忽略',
                    nzOnOk: () => location.reload()
                });
            }
            if (ev instanceof NavigationEnd) {
                this.titleSrv.setTitle();
                // this.modalSrv.closeAll();
                if (WindowModel.eruptRouterEvent) {
                    let url: string = ev["url"];
                    url = url.substring(0, (url.indexOf("?") === -1 ? url.length : url.indexOf("?")));
                    let paths = url.split("/");
                    let match = paths[paths.length - 1];
                    if (match != this.beforeMatch) {
                        if (this.beforeMatch) {
                            if (WindowModel.eruptRouterEvent.$) {
                                WindowModel.eruptRouterEvent.$.unload && WindowModel.eruptRouterEvent.$.unload(ev);
                            }
                            let beforeEvent = WindowModel.eruptRouterEvent[this.beforeMatch];
                            beforeEvent && beforeEvent.unload && beforeEvent.unload(ev);
                        }
                        let event = WindowModel.eruptRouterEvent[match];
                        if (WindowModel.eruptRouterEvent.$) {
                            WindowModel.eruptRouterEvent.$.load && WindowModel.eruptRouterEvent.$.load(ev);
                        }
                        event && event.load && event.load(ev);
                    }
                    this.beforeMatch = match;
                }
            }
        });
    }
}
