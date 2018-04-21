const bigInt = require("big-integer");

function asyncWait (step) {
    // return an iterative promise handler
    return (prev, next) => new Promise((resolve, reject) => {
        // generate some rejections here to test the error callback
        const rand = Math.random() > 0;
        const func = rand ? resolve : reject;
        const iter = rand ? bigInt(prev || 1).multiply(next + 1) : "pop";
        // wait for n steps
        setTimeout(func, step, iter);
    });
}

function promiseTrampoline (subject) {
    // trampolined function
    function instant (targets) {
        // looping construct
        function iterate (respond, counter = 0, outputs = []) {
            // invoked by the promise "then" block
            function resolve (results) {
                // push the next results to the outputs array
                outputs.push(results);
                // are we finished looping? if so, return the outputs
                return counter < targets.length - 1 ?
                    iterate(respond, ++counter, outputs) :
                    respond(null, outputs);
            }
            // invoke the promise
            const functor = subject(outputs[counter - 1], targets[counter]);
            // promise-thunk
            const thunked = functor.then.bind(functor);
            // set it and forget it - queue the promise resolution on the
            // event loop, where it will be triggered at the start of the
            // next cycle, once any outstanding work is completed and the
            // call stack drained
            return void process.nextTick(thunked, resolve, respond);
        }
        // return a promise object
        return new Promise((res, rej) => {
            // start iterating
            iterate((err, data) => err ? rej(err) : res(data));
        });
    }
    // return the trampolined promise
    return instant;
}

const step = 10;

const size = 100;

const bouncer = promiseTrampoline(asyncWait(step));

const series = [...Array(size).keys()];

bouncer(series)
    .then(data => {
        console.log(data.pop().toString());
    })
    .catch(error => {
        console.log("error:", new Error(error));
    });
