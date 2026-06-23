import { Meta, StoryObj } from '@storybook/angular';
import { CalculatorComponent } from './calculator.component';

const meta: Meta<CalculatorComponent> = {
  title: 'Interactives/11-11-Calculator',
  component: CalculatorComponent,
  tags: ['autodocs'],
  argTypes: {
    config: {
      control: 'object',
      description: 'Calculator parameter configurations'
    },
    telemetryUpdate: {
      action: 'telemetryUpdate',
      description: 'Host telemetry event updates'
    }
  }
};

export default meta;
type Story = StoryObj<CalculatorComponent>;

// Scenario 1: Default (all features enabled)
export const Default: Story = {
  args: {
    config: {
      enableHistory: true,
      maxHistoryCount: 20,
      allowDecimals: true,
      decimalPrecision: 8,
      enableScientific: true,
      defaultAngleMode: 'deg'
    }
  }
};

// Scenario 2: Pocket Calculator (scientific keys disabled, decimals enabled, history enabled)
export const PocketCalculator: Story = {
  args: {
    config: {
      enableHistory: true,
      maxHistoryCount: 15,
      allowDecimals: true,
      decimalPrecision: 6,
      enableScientific: false,
      defaultAngleMode: 'deg'
    }
  }
};

// Scenario 3: Basic (decimals disabled, history disabled, scientific keys disabled)
export const Basic: Story = {
  args: {
    config: {
      enableHistory: false,
      allowDecimals: false,
      enableScientific: false
    }
  }
};
