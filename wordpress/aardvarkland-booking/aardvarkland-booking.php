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

function aardvarkland_service_booking_render() {
    wp_enqueue_style( 'aardvarkland-service-booking', plugins_url( 'booking.css', __FILE__ ), array(), '1.0.0' );
    wp_enqueue_script_module( 'aardvarkland-service-booking', plugins_url( 'booking.js', __FILE__ ), array(), '1.0.0' );
    return (string) file_get_contents( __DIR__ . '/booking.html' );
}

add_shortcode( 'aardvarkland_booking', 'aardvarkland_service_booking_render' );
