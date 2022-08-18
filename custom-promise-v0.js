'use strict';

const STATE = {
    PENDING: 'pending',
    FULLFILLED: 'fullfilled',
    REJECTED: 'rejected'
}



class MyPromise {
    #thenCallbacks = [];
    #catchCallbacks = [];
    #onSuccessBind = this.#onSuccess.bind(this);
    #onFailBind = this.#onFail.bind(this);

    #state;
    #value;

    constructor(callback) {
        try {
            callback(this.#onSuccessBind, this.#onFailBind)
        } catch (e) {
            this.#onFailBind(e)
        }
    }

    #runCallbacks() {
        if (this.#state === STATE.FULLFILLED) {
            this.#thenCallbacks.forEach(item => {
                item(this.#value);
            });
            this.#thenCallbacks = [];
        }
        if (this.#state === STATE.REJECTED) {
            this.#catchCallbacks.forEach(item => {
                item(this.#value);
            });
            this.#catchCallbacks = [];
        }
    }

    #onSuccess(value) {
        queueMicrotask(() => {
            if (this.#state !== STATE.FULLFILLED) return;

            if (value instanceof MyPromise) {
                value.then(this.#onSuccessBind, this.#onFailBind);
                return;
            }

            this.#value = value;
            this.#state = STATE.FULLFILLED;
            this.#runCallbacks();
        });

    }
    #onFail(value) {
        queueMicrotask(() => {
            if (this.#state !== STATE.FULLFILLED) return;
            if (value instanceof MyPromise) {
                value.then(this.#onSuccessBind, this.#onFailBind);
                return;
            }

            if (this.#catchCallbacks.length === 0) {
                throw new UncaughtPromiseError(value);
            }
            this.#value = value;
            this.#state = STATE.REJECTED;
            this.#runCallbacks();
        });

    }

    then(thenCallback, catchCallback) {
        return new MyPromise((resolve, reject) => {
            this.#thenCallbacks.push(result => {
                if (thenCallback === null) {
                    resolve(result);
                    return;
                }
                try {
                    resolve(thenCallback(result))
                } catch (e) {
                    reject(e);
                }
            });

            this.#catchCallbacks.push(result => {
                if (catchCallback === null) {
                    reject(result);
                    return;
                }
                try {
                    resolve(catchCallback(result))
                } catch (e) {
                    reject(e);
                }
            });
            this.#runCallbacks();
        });
    }

    catch(callback) {
        return this.then(undefined, callback);
    }

    finally(callback) {
        return this.then(result => {
            callback();
            return result;
        },
            result => {
                callback();
                throw result;
            })
    }
}

class UncaughtPromiseError extends Error {
    constructor(error) {
        super(error);
        this.stack = `(in promise) ${error.stack}`;
    }
}
