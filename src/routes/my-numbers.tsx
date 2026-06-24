import { createFileRoute } from '@tanstack/react-router';
import { MyNumbersPage } from '../pages/MyNumbersPage';

export const Route = createFileRoute('/my-numbers')({
  component: MyNumbersPage,
});
