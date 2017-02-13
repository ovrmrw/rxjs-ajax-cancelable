import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import 'rxjs/add/observable/of'
import 'rxjs/add/observable/interval'

import 'rxjs/add/operator/map'
import 'rxjs/add/operator/delay'
import 'rxjs/add/operator/do'

import { AjaxCancelable, AjaxRequestPlus, AjaxResponsePlus } from '../index'



class Action {
  private cancelable: AjaxCancelable

  constructor(request: AjaxRequestPlus) {
    this.cancelable = new AjaxCancelable(request)
  }

  requestDownload$(): Observable<AjaxResponsePlus> {
    return this.cancelable
      .requestAjax()
  }
}



describe('Firebase test', () => {
  let action: Action

  beforeEach(() => {
    action = new Action({
      method: 'GET',
      url: 'https://rxjs-ajax-cancelable-d2228.firebaseio.com/users/jack.json',
      crossDomain: true,
      timeout: 1000 * 10,
      testing: true,
    })
  })

  it('get json', async () => {
    const res = await action.requestDownload$().toPromise()
    expect(res.status).toBe(200)
    expect(res.responseType).toBe('json')
    expect(res.response).toEqual({ name: 'Jack' })
  })

  it('HTTP requests are cancelable.', (done) => {
    const results: {}[] = []
    const timer = setInterval(() => {
      action.requestDownload$().toPromise()
        .then(res => results.push(res.response))
    }, 50)

    setTimeout(() => {
      clearInterval(timer)
      setTimeout(() => {
        expect(results.length).toBe(1)
        expect(results).toEqual([{ name: 'Jack' }])
        done()
      }, 2000)
    }, 200)
  })

})
