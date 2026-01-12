import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WakeTubeIcon from './WakeTubeIcon';

describe('WakeTubeIcon', () => {
    it('renders an SVG element', () => {
        render(<WakeTubeIcon />);
        const svg = document.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });

    it('applies custom className', () => {
        render(<WakeTubeIcon className="test-class w-10 h-10" />);
        const svg = document.querySelector('svg');
        expect(svg).toHaveClass('test-class');
        expect(svg).toHaveClass('w-10');
        expect(svg).toHaveClass('h-10');
    });

    it('has correct viewBox', () => {
        render(<WakeTubeIcon />);
        const svg = document.querySelector('svg');
        expect(svg).toHaveAttribute('viewBox', '0 0 40 40');
    });

    it('contains the play button path', () => {
        render(<WakeTubeIcon />);
        const paths = document.querySelectorAll('path');
        expect(paths.length).toBeGreaterThan(0);
    });

    it('contains gradient definition', () => {
        render(<WakeTubeIcon />);
        const gradient = document.querySelector('linearGradient');
        expect(gradient).toBeInTheDocument();
        expect(gradient).toHaveAttribute('id', 'gradient_waketube');
    });

    it('renders without className prop', () => {
        render(<WakeTubeIcon />);
        const svg = document.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });
});
