$( document ).ready(function() {
    $('.accordion-title').prepend('<div class="accordion-plus-button">+</div>');
});

$('.accordion-expand-all').click(function() {
    console.log('Clicked');
    $('#action-plan').foundation('down', $('.accordion-content'));
});