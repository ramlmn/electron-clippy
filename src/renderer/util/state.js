const listeners = new Map();

const subscribe = (event, callback) => {
  if (listeners.get(event)) {
    listeners.get(event).push(callback);
  } else {
    listeners.set(event, [callback]);
  }
};

const dispatch = (event, ...data) => {
  const subscribers = listeners.get(event) || [];

  subscribers.forEach(subscriber => {
    try {
      subscriber(...data);
    } catch (e) {}
  });
};

export {
  subscribe,
  dispatch
};
