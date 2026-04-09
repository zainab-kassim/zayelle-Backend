import Bottleneck from 'bottleneck';

const apithrottle = new Bottleneck({
  maxConcurrent: 1, // one request at a time
  minTime: 200, // wait 200ms between each call
});

export default apithrottle;
