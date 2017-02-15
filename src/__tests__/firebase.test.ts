import * as fetch from 'isomorphic-fetch'
import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import 'rxjs/add/observable/of'
import 'rxjs/add/observable/interval'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/delay'
import 'rxjs/add/operator/do'

import { AjaxCancelable, AjaxRequestOptions, AjaxResponsePlus } from '../index'



class Action {
  private cancelable: AjaxCancelable

  constructor(private request: AjaxRequestOptions) {
    this.cancelable = new AjaxCancelable(request)
  }

  requestCancelable(): Promise<AjaxResponsePlus> {
    return this.cancelable
      .requestAjax()
      .toPromise()
  }

  requestNotCancelable(): Promise<ResponseInterface> {
    return fetch(this.request.url || '')
  }
}



describe('Firebase test', () => {
  let action: Action

  beforeEach(() => {
    action = new Action({
      method: 'GET',
      url: 'https://rxjs-ajax-cancelable-d2228.firebaseio.com/users/jack.json',
      crossDomain: true,
      timeout: 1000 * 5,
      testing: true,
    })
  })


  it('get json', async () => {
    const res = await action.requestCancelable()
    expect(res.status).toBe(200)
    expect(res.responseType).toBe('json')
    expect(res.response).toEqual({ name: 'Jack' })
  })


  it('Fetch cannot cancel requests.', async () => {
    const results: any[] = []
    for (let i = 0; i < 3; i++) {
      action.requestNotCancelable()
        .then(res => res.json() as {})
        .then(result => results.push(result))
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    await new Promise(resolve => setTimeout(resolve, 2000))
    expect(results.length).toBe(3)
    expect(results).toEqual([{ name: 'Jack' }, { name: 'Jack' }, { name: 'Jack' }])
  })


  it('RxJS can cancel requests.', async () => {
    const results: any[] = []
    for (let i = 0; i < 3; i++) {
      action.requestCancelable()
        .then(res => results.push(res.response))
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    await new Promise(resolve => setTimeout(resolve, 2000))
    expect(results.length).toBe(1)
    expect(results).toEqual([{ name: 'Jack' }])
  })

})
