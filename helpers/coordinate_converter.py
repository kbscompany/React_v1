"""
Unified Coordinate Conversion System for Arabic Cheque Generator
Ensures consistent conversion between browser and PDF coordinate systems
"""

from typing import Tuple, Dict, Any


class CoordinateConverter:
    """
    Handles conversion between different coordinate systems:
    - Browser System: Origin at top-left (0,0), Y increases downward (used by frontend)
    - PDF System: Origin at bottom-left (0,0), Y increases upward (used for final PDF rendering)
    
    This class ensures all coordinate transformations are consistent across the application.
    """
    
    # Standard A4 page dimensions in points (1 point = 1 pixel at 72 DPI)
    PAGE_WIDTH = 595
    PAGE_HEIGHT = 842
    
    @staticmethod
    def browser_to_pdf(browser_x: float, browser_y: float) -> Tuple[float, float]:
        """
        Convert browser coordinates (top-left origin) to PDF coordinates (bottom-left origin).
        
        Args:
            browser_x: X coordinate in browser space (left to right)
            browser_y: Y coordinate in browser space (top to bottom)
            
        Returns:
            Tuple of (pdf_x, pdf_y) coordinates
        """
        # X remains the same (left to right in both systems)
        pdf_x = browser_x
        
        # Y needs inversion: browser y=0 (top) -> PDF y=842 (top)
        pdf_y = CoordinateConverter.PAGE_HEIGHT - browser_y
        
        return (pdf_x, pdf_y)
    
    @staticmethod
    def pdf_to_browser(pdf_x: float, pdf_y: float) -> Tuple[float, float]:
        """
        Convert PDF coordinates (bottom-left origin) to browser coordinates (top-left origin).
        
        Args:
            pdf_x: X coordinate in PDF space
            pdf_y: Y coordinate in PDF space
            
        Returns:
            Tuple of (browser_x, browser_y) coordinates
        """
        # X remains the same
        browser_x = pdf_x
        
        # Y needs inversion
        browser_y = CoordinateConverter.PAGE_HEIGHT - pdf_y
        
        return (browser_x, browser_y)
    
    @staticmethod
    def convert_browser_positions_to_pdf(browser_positions: Dict[str, Dict[str, float]]) -> Dict[str, Tuple[float, float]]:
        """
        Convert a dictionary of browser positions to PDF position tuples.
        
        Args:
            browser_positions: Dictionary with format {"field": {"x": value, "y": value}}
            
        Returns:
            Dictionary with format {"field": (pdf_x, pdf_y)}
        """
        result = {}
        for field_key, pos in browser_positions.items():
            if isinstance(pos, dict) and 'x' in pos and 'y' in pos:
                pdf_x, pdf_y = CoordinateConverter.browser_to_pdf(pos['x'], pos['y'])
                result[field_key] = (pdf_x, pdf_y)
        return result
    
    @staticmethod
    def convert_pdf_positions_to_browser(pdf_positions: Dict[str, Tuple[float, float]]) -> Dict[str, Dict[str, float]]:
        """
        Convert PDF position tuples to browser position dictionary format.
        
        Args:
            pdf_positions: Dictionary with format {"field": (pdf_x, pdf_y)}
            
        Returns:
            Dictionary with format {"field": {"x": value, "y": value}}
        """
        result = {}
        for field_key, pos in pdf_positions.items():
            if isinstance(pos, (tuple, list)) and len(pos) >= 2:
                browser_x, browser_y = CoordinateConverter.pdf_to_browser(pos[0], pos[1])
                result[field_key] = {"x": browser_x, "y": browser_y}
        return result
    
    @staticmethod
    def browser_to_css_cm(browser_x: float, browser_y: float) -> Tuple[str, str]:
        """
        Convert browser coordinates to CSS centimeter values for HTML printing.
        
        Args:
            browser_x: X coordinate in browser space
            browser_y: Y coordinate in browser space
            
        Returns:
            Tuple of (css_x_cm, css_y_cm) as strings with 'cm' suffix
        """
        # Conversion factor: 595px = 21cm, so 1px = 0.026458cm
        PX_TO_CM = 0.026458
        
        css_x = f"{(browser_x * PX_TO_CM):.2f}cm"
        css_y = f"{(browser_y * PX_TO_CM):.2f}cm"
        
        return (css_x, css_y)
    
    @staticmethod
    def debug_coordinate_conversion(field_name: str, browser_x: float, browser_y: float) -> str:
        """
        Generate debug information showing coordinate conversion.
        
        Args:
            field_name: Name of the field
            browser_x: X coordinate in browser space
            browser_y: Y coordinate in browser space
            
        Returns:
            Debug string with browser, PDF, and CSS coordinate information
        """
        pdf_x, pdf_y = CoordinateConverter.browser_to_pdf(browser_x, browser_y)
        css_x, css_y = CoordinateConverter.browser_to_css_cm(browser_x, browser_y)
        
        return (f"Field '{field_name}': "
                f"Browser({browser_x:.1f}, {browser_y:.1f}) -> "
                f"PDF({pdf_x:.1f}, {pdf_y:.1f}) -> "
                f"CSS({css_x}, {css_y})")
    
    @staticmethod
    def validate_browser_coordinates(positions: Dict[str, Dict[str, float]]) -> bool:
        """
        Validate that all positions are in proper browser coordinate format.
        
        Args:
            positions: Dictionary of positions to validate
            
        Returns:
            True if all positions are valid, False otherwise
        """
        for field_key, pos in positions.items():
            if not isinstance(pos, dict):
                return False
            if 'x' not in pos or 'y' not in pos:
                return False
            if not isinstance(pos['x'], (int, float)) or not isinstance(pos['y'], (int, float)):
                return False
        return True
    
    # Legacy compatibility methods (deprecated but kept for backward compatibility)
    
    @staticmethod
    def ui_to_pdf(x: float, y: float) -> Tuple[float, float]:
        """
        DEPRECATED: Use browser_to_pdf instead.
        Legacy method for backward compatibility.
        """
        return CoordinateConverter.browser_to_pdf(x, y)
    
    @staticmethod
    def pdf_to_ui(x: float, y: float) -> Tuple[float, float]:
        """
        DEPRECATED: Use pdf_to_browser instead.
        Legacy method for backward compatibility.
        """
        return CoordinateConverter.pdf_to_browser(x, y)
    
    @staticmethod
    def convert_positions_dict_ui_to_pdf(positions: Dict[str, Dict[str, float]]) -> Dict[str, Tuple[float, float]]:
        """
        DEPRECATED: Use convert_browser_positions_to_pdf instead.
        Legacy method for backward compatibility.
        """
        return CoordinateConverter.convert_browser_positions_to_pdf(positions)
    
    @staticmethod
    def convert_positions_array_to_dict(positions: Dict[str, list]) -> Dict[str, Dict[str, float]]:
        """
        Convert legacy array format to browser coordinate dictionary format.
        
        Args:
            positions: Dictionary with format {"field": [x, y]}
            
        Returns:
            Dictionary with format {"field": {"x": value, "y": value}}
        """
        result = {}
        for field_key, pos in positions.items():
            if isinstance(pos, list) and len(pos) >= 2:
                result[field_key] = {"x": pos[0], "y": pos[1]}
        return result
    
    @staticmethod
    def convert_positions_dict_to_array(positions: Dict[str, Dict[str, float]]) -> Dict[str, list]:
        """
        Convert browser coordinate dictionary format to legacy array format.
        
        Args:
            positions: Dictionary with format {"field": {"x": value, "y": value}}
            
        Returns:
            Dictionary with format {"field": [x, y]}
        """
        result = {}
        for field_key, pos in positions.items():
            if isinstance(pos, dict) and 'x' in pos and 'y' in pos:
                result[field_key] = [pos['x'], pos['y']]
        return result
    
    @staticmethod
    def debug_position(field_name: str, ui_x: float, ui_y: float) -> str:
        """
        DEPRECATED: Use debug_coordinate_conversion instead.
        Legacy method for backward compatibility.
        """
        return CoordinateConverter.debug_coordinate_conversion(field_name, ui_x, ui_y) 