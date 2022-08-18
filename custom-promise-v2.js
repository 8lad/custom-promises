'use strict';

const STATE = {
    PENDING: 'PENDING',
    FULLFILLED: 'FULLFILLED',
    REJECTED: 'REJECTED'
}

class MyPromise {
    constructor(callback) {
        this.state = STATE.PENDING;
        this.value = undefined;
        this.handlers = [];
        try {
            callback(this._resolve, this._reject);
        } catch (e) {
            this._reject(e);
        }
    }
    _resolve = (value) => {
        this.updateResult(value, STATE.FULLFILLED);
    };
    _reject = () => {
        this.updateResult(error, STATE.REJECTED);
    };

    updateResult(value, state) {
        setTimeout(() => {
            if (this.state !== STATE.PENDING) {
                return
            }
            if (this.Thuenable(value)) {
                return value.then(this._resolve, this._reject);
            }
            this.value = value;
            this.state = state;
            this.evecuterHandlers();
        }, 0)
    }

    then(onSuccess, onFail) {
        return new MyPromise((res, rej) => {
            this.addHandlers({
                onSuccess: function (value) {
                    if (!onSuccess) {
                        return res(value);
                    }
                    try {
                        return res(onSuccess(value))
                    } catch (err) {
                        return rej(err);
                    }
                },
                onFail: function (value) {
                    if (!onFail) {
                        return rej(value);
                    }
                    try {
                        return res(onFail(value))
                    } catch (err) {
                        return rej(err);
                    }
                }
            });
        });
    }

    addHandlers(handlers) {
        this.handlers.push(handlers);
        this.executeHandlers();
    }

    executeHandlers() {
        if (this.state === STATE.PENDING) {
            return null;
        }

        this.handlers.forEach((handler) => {
            if (this.state === STATE.FULFILLED) {
                return handler.onSuccess(this.value);
            }
            return handler.onFail(this.value);
        });
        this.handlers = [];
    }
    catch(onFail) {
        return this.then(null, onFail);
    }
    finally(callback) {
        return new MyPromise((res, rej) => {
            let val;
            let wasRejected;
            this.then((value) => {
                wasRejected = false;
                val = value;
                return callback();
            }, (e) => {
                wasRejected = true;
                val = e;
            }).then(() => {
                if (!wasRejected) {
                    return res(val);
                }
                return rej(val);
            })
        })
    }
}

function isThenable(val) {
    return val instanceof MyPromise;
}
