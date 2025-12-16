export interface MyEvent {
  id?: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  bgColor?: string;
  desc?: string;
  source?: 'api';
}