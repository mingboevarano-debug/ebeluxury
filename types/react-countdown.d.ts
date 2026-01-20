declare module 'react-countdown' {
  import { Component } from 'react';

  interface CountdownProps {
    date: Date | string | number;
    renderer?: (props: {
      days: number;
      hours: number;
      minutes: number;
      seconds: number;
      completed: boolean;
    }) => React.ReactNode;
    onComplete?: () => void;
    onTick?: () => void;
  }

  export default class Countdown extends Component<CountdownProps> {}
}

