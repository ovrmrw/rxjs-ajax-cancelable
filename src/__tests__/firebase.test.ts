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

  requestCancelable(request?: AjaxRequestOptions): Promise<AjaxResponsePlus> {
    return this.cancelable
      .requestAjax(request)
      .toPromise()
  }

  requestNotCancelable(): Promise<ResponseInterface> {
    return fetch(this.request.url || '')
  }

  manualCancel(): void {
    this.cancelable.cancelAjax()
  }
}



describe('', () => {

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

      action.requestNotCancelable()
        .then(res => res.json() as {})
        .then(result => results.push(result))
      await waiting(50)
      action.requestNotCancelable()
        .then(res => res.json() as {})
        .then(result => results.push(result))
      await waiting(50)
      action.requestNotCancelable()
        .then(res => res.json() as {})
        .then(result => results.push(result))

      await waiting(3000)
      expect(results.length).toBe(3)
      expect(results).toEqual([{ name: 'Jack' }, { name: 'Jack' }, { name: 'Jack' }])
    })


    it('RxJS can cancel requests.', async () => {
      const results: any[] = []

      action.requestCancelable()
        .then(res => results.push(res.response))
      await waiting(50)
      action.requestCancelable()
        .then(res => results.push(res.response))
      await waiting(50)
      action.requestCancelable()
        .then(res => results.push(res.response))

      await waiting(3000)
      expect(results.length).toBe(1)
      expect(results).toEqual([{ name: 'Jack' }])
    })
  })



  describe('Prioritize first test', () => {
    let action: Action

    beforeEach(() => {
      action = new Action({
        method: 'GET',
        crossDomain: true,
        timeout: 1000 * 5,
        testing: true,
        priorityFirst: true,
      })
    })

    it('Prioritize the first stream.', async () => {
      const results: any[] = []

      action.requestCancelable({ url: 'https://rxjs-ajax-cancelable-d2228.firebaseio.com/users/ted.json' })
        .then(res => results.push(res.response))
      await waiting(50)
      action.requestCancelable({ url: 'https://rxjs-ajax-cancelable-d2228.firebaseio.com/users/jack.json' })
        .then(res => results.push(res.response))
      await waiting(50)
      action.requestCancelable({ url: 'https://rxjs-ajax-cancelable-d2228.firebaseio.com/users/jack.json' })
        .then(res => results.push(res.response))

      await waiting(3000)
      expect(results.length).toBe(1)
      expect(results).toEqual([{ name: 'Ted' }])
    })
  })



  describe('Prioritize last test', () => {
    let action: Action

    beforeEach(() => {
      action = new Action({
        method: 'GET',
        crossDomain: true,
        timeout: 1000 * 5,
        testing: true,
        priorityFirst: false, // default setting
      })
    })

    it('Prioritize the last stream.', async () => {
      const results: any[] = []

      action.requestCancelable({ url: 'https://rxjs-ajax-cancelable-d2228.firebaseio.com/users/jack.json' })
        .then(res => results.push(res.response))
      await waiting(50)
      action.requestCancelable({ url: 'https://rxjs-ajax-cancelable-d2228.firebaseio.com/users/jack.json' })
        .then(res => results.push(res.response))
      await waiting(50)
      action.requestCancelable({ url: 'https://rxjs-ajax-cancelable-d2228.firebaseio.com/users/ted.json' })
        .then(res => results.push(res.response))

      await waiting(3000)
      expect(results.length).toBe(1)
      expect(results).toEqual([{ name: 'Ted' }])
    })
  })


  describe('cancellation', () => {
    let action: Action

    beforeEach(() => {
      action = new Action({
        method: 'GET',
        crossDomain: true,
        testing: true,
        retry: 0,
      })
    })

    it('manual cancel', async () => {
      let result: any = { description: 'this value will be replaced by undefined.' }
      action.requestCancelable({ url: 'https://rxjs-ajax-cancelable-d2228.firebaseio.com/users/jack.json' })
        .then(res => result = res)
      await waiting(10)
      action.manualCancel()
      await waiting()
      expect(result).toBeUndefined()
    })
  })

})



function waiting(timeout: number = 0) {
  return new Promise(resolve => setTimeout(resolve, timeout))
}
