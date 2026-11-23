<?php
/**
 * Plugin Name: Aardvarkland Service Booking
 * Description: Adds a service calculator and a fictional request flow via shortcode.
 * Version: 1.0.0
 * Requires at least: 6.5
 * Requires PHP: 7.4
 * License: MIT
 */

defined( 'ABSPATH' ) || exit;

function aardvarkland_service_booking_assets() {
    wp_enqueue_style( 'aardvarkland-service-booking', plugins_url( 'booking.css', __FILE__ ), array(), '1.0.0' );
    wp_enqueue_script_module( 'aardvarkland-service-booking', plugins_url( 'booking.js', __FILE__ ), array(), '1.0.0' );
}

function aardvarkland_service_booking_page_assets() {
    $page = get_queried_object();
    if ( is_singular() && $page instanceof WP_Post && has_shortcode( $page->post_content, 'aardvarkland_booking' ) ) {
        aardvarkland_service_booking_assets();
    }
}

function aardvarkland_service_booking_render() {
    aardvarkland_service_booking_assets();
    return (string) file_get_contents( __DIR__ . '/booking.html' );
}

add_action( 'wp_enqueue_scripts', 'aardvarkland_service_booking_page_assets' );
add_shortcode( 'aardvarkland_booking', 'aardvarkland_service_booking_render' );
