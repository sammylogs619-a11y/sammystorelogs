import { createFileRoute } from '@tanstack/react-router';
import { ForeignNumbersCountryPage } from '../pages/ForeignNumbersCountryPage';

export const Route = createFileRoute('/foreign-numbers/$country')({
  component: ForeignNumbersCountryPage,
});
