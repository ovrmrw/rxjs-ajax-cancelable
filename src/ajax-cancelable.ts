import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import { AjaxResponse } from 'rxjs/observable/dom/AjaxObservable'
import 'rxjs/add/observable/of'
import 'rxjs/add/observable/dom/ajax'
import 'rxjs/add/operator/take'
import 'rxjs/add/operator/takeUntil'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/switchMap'
// import 'rxjs/add/operator/timeout'
// import 'rxjs/add/operator/timeoutWith'
import 'rxjs/add/operator/retry'
import 'rxjs/add/operator/catch'
import 'rxjs/add/operator/toPromise'
import 'rxjs/add/operator/do'
import 'rxjs/add/operator/share'

import { AjaxResponsePlus, AjaxRequestOptions, AjaxObject } from './interfaces'


const DEFAULT_TIMEOUT = 1000 * 15
const DEFAULT_RETRY = 2
// let DISPOSE_TIME = 0 // 1000 * 10 // DEPRECATED
let TESTING = false


export class AjaxCancelable {
  private refCount = 0
  // private disposeTimer: NodeJS.Timer
  private subject$: Subject<AjaxObject>
  private canceller$: Subject<void>


  constructor(
    private request?: AjaxRequestOptions,
  ) { }


  private invokeSubjects(): void {
    if (!this.canceller$ || this.canceller$.isStopped) {
      this.canceller$ = new Subject<void>()
    }

    if (!this.subject$ || this.subject$.isStopped) {
      this.subject$ = new Subject<AjaxObject>()
      this.subject$
        .switchMap(ajaxObj => {
          const startTime = new Date().getTime()
          // let loopCount = 0 // DEPRECATED
          return Observable.ajax(ajaxObj.request)
            .retry(ajaxObj.retry)
            .catch((err, caught) => {
              if (err) {
                console.error({
                  status: err.status,
                  message: err.message,
                  url: err.request.url,
                  response: err.response,
                })
                return Observable.of(null)
              } else {
                return caught
              }
            })
            .take(1)
            .takeUntil(this.canceller$)
            .map(data => {
              if (data) { // "data" is nullable.
                ajaxObj.response = {
                  ...data,
                  processingTime: new Date().getTime() - startTime,
                }
              }
              return ajaxObj
            })
        })
        .subscribe({
          next: ajaxObj => ajaxObj.responseSubject$.next(ajaxObj.response),
          error: err => { throw err },
        })
    }
  }


  requestAjax(request?: AjaxRequestOptions): Observable<AjaxResponsePlus | never> {
    if (!this.request && !request) {
      throw new Error('ERROR: AjaxRequest is undefined.')
    }

    this.refCount += 1
    // clearTimeout(this.disposeTimer)
    this.invokeSubjects()

    const _request: AjaxRequestOptions = Object.assign({}, this.request, request) // merge request objects.
    _request.timeout = _request.timeout || DEFAULT_TIMEOUT
    if (_request.testing) {
      TESTING = true
      // DISPOSE_TIME = 0 // DEPRECATED
    }

    const responseSubject$ = new Subject<AjaxResponsePlus | null>()
    const ajaxObj: AjaxObject = {
      request: _request,
      response: null,
      responseSubject$,
      retry: typeof _request.retry === 'number' && _request.retry >= 0 ? _request.retry : DEFAULT_RETRY,
    }

    this.subject$.next(ajaxObj)

    const observable = responseSubject$
      .take(1)
      .filter(data => {
        if (data) { // "data" is nullable.
          return true
        } else {
          console.warn('WARN: AjaxResponse is null.')
          setTimeout(() => responseSubject$.unsubscribe())
          return false
        }
      })
      .catch((err, caught) => {
        if (err) {
          return Observable.of(undefined)
        } else {
          return caught
        }
      })
      .share()

    observable
      .subscribe({
        complete: () => {
          if (TESTING) {
            console.log('responseSubject$ is completed.')
          }
          // this.disposeTimer = setTimeout(() => {
          //   this.unsubscribeSubjects()
          //   if (TESTING) {
          //     console.log('Ajax subjects are unsubscribed.')
          //   }
          // }, DISPOSE_TIME)
          this.refCount -= 1
          if (this.refCount === 0) {
            this.unsubscribeSubjects()
            if (TESTING) {
              console.log('Ajax subjects are unsubscribed.')
            }
          }
        }
      })

    return observable
  }


  requestAjaxAsPromise(request?: AjaxRequestOptions): Promise<AjaxResponsePlus | never> {
    return this.requestAjax(request).toPromise()
  }


  cancelAjax(): void {
    this.canceller$.next()
  }


  unsubscribeSubjects(): void {
    if (this.subject$) {
      this.subject$.unsubscribe()
    }
    if (this.canceller$) {
      this.canceller$.unsubscribe()
    }
  }

}
