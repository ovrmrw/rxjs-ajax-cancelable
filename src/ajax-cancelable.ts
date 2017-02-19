import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import { AjaxResponse } from 'rxjs/observable/dom/AjaxObservable'
import 'rxjs/add/observable/of'
import 'rxjs/add/observable/dom/ajax'
import 'rxjs/add/operator/take'
import 'rxjs/add/operator/takeUntil'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/mergeMap'
import 'rxjs/add/operator/switchMap'
import 'rxjs/add/operator/exhaustMap'
// import 'rxjs/add/operator/timeout'
// import 'rxjs/add/operator/timeoutWith'
import 'rxjs/add/operator/retry'
import 'rxjs/add/operator/catch'
import 'rxjs/add/operator/toPromise'
import 'rxjs/add/operator/do'
import 'rxjs/add/operator/share'
import 'rxjs/add/operator/partition'

import { AjaxResponsePlus, AjaxRequestOptions, AjaxObject } from './interfaces'


const DEFAULT_TIMEOUT = 1000 * 15
const DEFAULT_RETRY = 2
let TESTING = false


export class AjaxCancelable {
  private refCount = 0
  private subject$: Subject<AjaxObject>
  private canceller$: Subject<void>


  constructor(
    private request?: AjaxRequestOptions,
  ) { }


  private invokeSubjects(): void {
    if (!this.canceller$ || this.canceller$.isStopped || this.canceller$.closed) {
      this.canceller$ = new Subject<void>()
    }

    if (!this.subject$ || this.subject$.isStopped || this.subject$.closed) {
      this.subject$ = new Subject<AjaxObject>()

      const obs = this.subject$
        .partition(ajaxObj => ajaxObj.priorityFirst)

      obs[0] // prioritize the first stream.
        .exhaustMap(ajaxObj => this.ajaxRequestCallback(ajaxObj))
        .subscribe({
          next: ajaxObj => ajaxObj.responseSubject$.next(ajaxObj.response),
          error: err => { throw err },
        })

      obs[1] // prioritize the last stream.
        .switchMap(ajaxObj => this.ajaxRequestCallback(ajaxObj))
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
    this.invokeSubjects()

    const _request: AjaxRequestOptions = Object.assign({}, this.request, request) // merge request objects.
    _request.timeout = _request.timeout || DEFAULT_TIMEOUT
    if (_request.testing) {
      TESTING = true
    }

    const responseSubject$ = new Subject<AjaxResponsePlus>()
    const ajaxObj: AjaxObject = {
      request: _request,
      response: null,
      responseSubject$,
      retry: typeof _request.retry === 'number' && _request.retry >= 0 ? _request.retry : DEFAULT_RETRY,
      priorityFirst: !!_request.priorityFirst,
    }

    this.subject$.next(ajaxObj)

    const observable = responseSubject$
      .take(1)
      .takeUntil(this.canceller$)
      .share()

    observable
      .subscribe({
        complete: () => {
          if (TESTING) {
            console.log('responseSubject$ is completed.')
          }
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


  requestPriorityLastAjax(request?: AjaxRequestOptions): Observable<AjaxResponsePlus | never> {
    const _request: AjaxRequestOptions = { ...request, ...{ priorityFirst: false } }
    return this.requestAjax(_request)
  }


  requestPriorityLastAjaxAsPromise(request?: AjaxRequestOptions): Promise<AjaxResponsePlus | never> {
    return this.requestPriorityLastAjax(request).toPromise()
  }


  requestPriorityFirstAjax(request?: AjaxRequestOptions): Observable<AjaxResponsePlus | never> {
    const _request: AjaxRequestOptions = { ...request, ...{ priorityFirst: true } }
    return this.requestAjax(_request)
  }


  requestPriorityFirstAjaxAsPromise(request?: AjaxRequestOptions): Promise<AjaxResponsePlus | never> {
    return this.requestPriorityFirstAjax(request).toPromise()
  }


  cancelAjax(): void {
    console.log('Ajax cancel signal is sent.')
    this.canceller$.next()
  }


  private unsubscribeSubjects(): void {
    if (this.subject$) {
      this.subject$.unsubscribe()
    }
    if (this.canceller$) {
      this.canceller$.unsubscribe()
    }
  }


  private ajaxRequestCallback(ajaxObj: AjaxObject): Observable<AjaxObject> {
    const startTime = new Date().getTime()
    return Observable.ajax(ajaxObj.request)
      .retry(ajaxObj.retry)
      .catch((err, caught) => {
        if (err) {
          if (!TESTING) {
            console.error({
              status: err.status,
              message: err.message,
              url: err.request.url,
              response: err.response,
            })
          }
          return Observable.of(err)
        } else {
          return caught
        }
      })
      .take(1)
      .takeUntil(this.canceller$)
      .map(data => {
        ajaxObj.response = {
          ...data,
          processingTime: new Date().getTime() - startTime,
        }
        return ajaxObj
      })
  }

}
