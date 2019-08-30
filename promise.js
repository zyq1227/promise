const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

function MyPromise(callback) {
    this.status = PENDING; //储存状态
    this.__succ__res = null; //储存resolve结果
    this.__err__res = null; //储存reject结果
    this.__queue = []; //++     事件队列

    var _this = this;
    function resolver(res) {
        _this.status = FULFILLED;
        _this.__succ__res = res;
        _this.__queue.forEach(item => {//++     队列中事件的执行
            item.resolve(res);
        });
    };
    function rejecter(rej) {
        _this.status = REJECTED;
        _this.__err__res = rej;
        _this.__queue.forEach(item => {//++     队列中事件的执行
            item.reject(rej);
        });
    };
    callback(resolver, rejecter);
};

MyPromise.prototype.then = function(onFulfilled, onRejected) {
    if (this.status === FULFILLED) {
        onFulfilled(this.__succ__res);
    } else if (this.status === REJECTED) {
        onRejected(this.__err__res);
    } else {//++        pending状态，添加队列事件
        this.__queue.push({resolve: onFulfilled, reject: onRejected});
    };
};

MyPromise.prototype.then = function(onFulfilled, onRejected) {
    var _this = this;
    return new MyPromise(function(resFn, rejFn) {
        if (_this.status === FULFILLED) {
            handleFulfilled(_this.__succ__res);     // -+
        } else if (_this.status === REJECTED) {
            handleRejected(_this.__err__res);       // -+
        } else {//pending状态
            _this.__queue.push({resolve: handleFulfilled, reject: handleRejected}); // -+
        };

        function handleFulfilled(value) {   // ++   FULFILLED 状态回调
            // 取决于onFulfilled的返回值
            var returnVal = onFulfilled instanceof Function && onFulfilled(value) || value;
            if (returnVal['then'] instanceof Function) {
                returnVal.then(function(res) {
                    resFn(res);
                },function(rej) {
                    rejFn(rej);
                });
            } else {
                resFn(returnVal);
            };
        };
        function handleRejected(reason) {   // ++   REJECTED 状态回调
            if (onRejected instanceof Function) {
                var returnVal = onRejected(reason);
                if (typeof returnVal !== 'undefined' && returnVal['then'] instanceof Function) {
                    returnVal.then(function(res) {
                        resFn(res);
                    },function(rej) {
                        rejFn(rej);
                    });
                } else {
                    resFn(returnVal);
                };
            } else {
                rejFn(reason)
            }
        }

    })
};


MyPromise.all = function(arr) {
    if (!Array.isArray(arr)) {
        throw new TypeError('参数应该是一个数组!');
    };
    return new MyPromise(function(resolve, reject) {
        var i = 0, result = [];
        next();
        function next() {
            // 对于不是MyPromise实例的进行转换
            MyPromise.resolve(arr[i]).then(function (res) {
                result.push(res);
                i++;
                if (i === arr.length) {
                    resolve(result);
                } else {
                    next();
                };
            }, reject);
        }
    })
};
MyPromise.race =  function(arr) {
    if (!Array.isArray(arr)) {
        throw new TypeError('参数应该是一个数组!');
    };
    return new MyPromise(function(resolve, reject) {
        let done = false;
        arr.forEach(function(item) {
            MyPromise.resolve(item).then(function (res) {
                if (!done) {
                    resolve(res);
                    done = true;
                };
            }, function(rej) {
                if (!done) {
                    reject(rej);
                    done = true;
                };
            });
        })
    });
};
